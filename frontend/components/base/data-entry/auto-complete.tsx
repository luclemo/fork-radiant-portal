import {
  type AriaAttributes,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, ChevronDown, XIcon } from 'lucide-react';

import { CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/base/shadcn/command';
import { Skeleton } from '@/components/base/shadcn/skeleton';
import { useI18n } from '@/components/hooks/i18n';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

export type Option = {
  label: ReactNode;
  value: string;
  [name: string]: any;
};

/** Same scale as Input and Select. */
export type AutoCompleteSize = 'default' | 'sm' | 'xs' | 'xxs';
const sizeClasses: Record<AutoCompleteSize, string> = { default: 'h-9', sm: 'h-8', xs: 'h-7', xxs: 'h-6' };

export type AutoCompleteProps<T extends Option> = {
  /** Height, as on Input and Select. @default 'default' */
  size?: AutoCompleteSize;
  /** Show a clear button once a value is picked. Off for a required field. @default true */
  clearable?: boolean;
  /** Show a chevron on the right, as a Select does. @default false */
  chevron?: boolean;
  options?: T[];
  emptyIndicator?: ReactNode;
  noSearchIndicator?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  debounceDelay?: number;
  optionLabelProp?: keyof T;
  optionFilterProp?: keyof T;
  loading?: boolean;
  leftAddon?: ReactNode;
  /** Minimum length to consider a search has started. @default 0 */
  minSearchLength?: number;
  /** Set by `FormControl` when the field is in error, turns the control red. */
  'aria-invalid'?: AriaAttributes['aria-invalid'];
};

export function getSelectedOptionByValue<T extends Option>(value: string | undefined, options: T[]): T | undefined {
  return options.find(option => value === option.value);
}

export const AutoComplete = <T extends Option>({
  size = 'default',
  clearable = true,
  chevron = false,
  options: arrayOptions = [],
  placeholder,
  emptyIndicator,
  noSearchIndicator,
  value,
  onChange,
  disabled,
  debounceDelay = 500,
  onSearch,
  optionFilterProp = 'label',
  optionLabelProp = 'label',
  className,
  loading,
  leftAddon,
  minSearchLength = 0,
  'aria-invalid': ariaInvalid,
}: AutoCompleteProps<T>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState<T | undefined>(getSelectedOptionByValue(value, arrayOptions));
  const [inputValue, setInputValue] = useState<string>('');
  const [inputValueSearch, setInputValueSearch] = useState<string>('');
  const debouncedSearchTerm = useDebounce(inputValueSearch, debounceDelay);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) {
        return;
      }

      // Keep the options displayed when the user is typing
      if (!isOpen) {
        setOpen(true);
      }

      // This is not a default behaviour of the <input /> field
      if (event.key === 'Enter' && input.value !== '') {
        const optionToSelect = arrayOptions.find(option => option[optionFilterProp] === input.value);
        if (optionToSelect) {
          setSelected(optionToSelect);
          onChange?.(optionToSelect.value);
        }
      }

      if (event.key === 'Escape') {
        input.blur();
      }
    },
    [isOpen, arrayOptions, onChange],
  );

  const handleBlur = useCallback(() => {
    setOpen(false);
    setInputValue(selected?.[optionLabelProp] || '');
  }, [selected]);

  const handleSelectOption = useCallback(
    (selectedOption: T) => {
      setInputValue(selectedOption[optionLabelProp]);
      setSelected(selectedOption);

      onChange?.(selectedOption.value);

      // This is a hack to prevent the input from being focused after the user selects an option
      // We can call this hack: "The next tick"
      setTimeout(() => {
        inputRef?.current?.blur();
      }, 0);
    },
    [onChange],
  );

  useEffect(() => {
    if (value && arrayOptions.length > 0) {
      const selectedOption = getSelectedOptionByValue(value, arrayOptions);

      if (selectedOption) {
        setSelected(selectedOption);
        setInputValue(selectedOption[optionLabelProp]);
      }
    }
  }, [value, arrayOptions]);

  useEffect(() => {
    if (!onSearch || !open) return;

    if (debouncedSearchTerm) {
      onSearch?.(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, open]);

  const filteredOptions = arrayOptions.filter(option =>
    option[optionFilterProp].toLowerCase().trim().includes(inputValueSearch.toLowerCase().trim()),
  );

  const hasSearchStarted = debouncedSearchTerm.length >= minSearchLength;

  const getEmptyStateIndicator = () => {
    if (hasSearchStarted) {
      return emptyIndicator || <div className="text-center text-sm">{t('common.auto_complete.no_data')}</div>;
    }
    return noSearchIndicator || <div className="text-center text-sm">{t('common.auto_complete.type_to_search')}</div>;
  };

  return (
    <CommandPrimitive
      onKeyDown={handleKeyDown}
      className={className}
      // purposely not using the filter prop here
      // because we want to control the visibility of the options
      // based on the custom optionFilterProp
      shouldFilter={false}
    >
      <div className="w-full relative shadow-xs outline-none focus-within:ring-ring/50 focus-within:ring-[3px] rounded-md has-[[aria-invalid=true]]:focus-within:ring-destructive/50">
        <CommandInput
          ref={inputRef}
          aria-invalid={ariaInvalid}
          value={inputValue}
          onValueChange={
            loading
              ? undefined
              : value => {
                  setInputValue(value);
                  setInputValueSearch(value);
                }
          }
          onBlur={handleBlur}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="text-sm"
          wrapperClassName={sizeClasses[size]}
          leftAddon={leftAddon}
          rightAddon={
            <>
              {clearable && (
                <button
                  type="button"
                  onClick={() => {
                    setSelected(undefined);
                    setInputValue('');
                    onChange?.('');
                  }}
                  className={cn('h-[26px] p-0', {
                    hidden: !selected || disabled,
                  })}
                >
                  <XIcon size={16} className="" />
                </button>
              )}
              {chevron && <ChevronDown className="text-muted-foreground pointer-events-none ml-2 size-4 shrink-0" />}
            </>
          }
        />
      </div>
      <div className="relative">
        <div
          className={cn(
            'animate-in fade-in-0 zoom-in-95 absolute top-0 z-10 w-full rounded-xl bg-popover outline-none shadow-md',
            isOpen ? 'block mt-1' : 'hidden',
          )}
        >
          <CommandList className="rounded-lg border">
            {loading ? (
              <CommandPrimitive.Loading>
                <div className="p-1">
                  <Skeleton className="h-8 w-full" />
                </div>
              </CommandPrimitive.Loading>
            ) : null}
            {filteredOptions.length > 0 && !loading ? (
              <CommandGroup>
                {filteredOptions.map(option => (
                  <CommandItem
                    key={option.value}
                    value={option[optionFilterProp]}
                    onMouseDown={event => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onSelect={() => handleSelectOption(option)}
                    className="cursor-pointer"
                  >
                    <span className="flex-1">{option.label}</span>
                    {option.value === value ? <Check className="w-4" /> : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            {!loading && <CommandEmpty>{getEmptyStateIndicator()}</CommandEmpty>}
          </CommandList>
        </div>
      </div>
    </CommandPrimitive>
  );
};
