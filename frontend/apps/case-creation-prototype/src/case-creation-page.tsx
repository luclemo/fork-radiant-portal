import { Button } from '@/components/base/shadcn/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/base/shadcn/card';

import { useCaseCreationT } from './i18n';

const REQUIRED_TOTAL = 7;

type SectionKey = 'analysis' | 'patient' | 'clinical_signs' | 'other_clinical' | 'family';

function SectionCard({ index, titleKey }: { index: number; titleKey: SectionKey }) {
  const { t } = useCaseCreationT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {index} · {t(`section.${titleKey}`)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{t('section.placeholder')}</p>
      </CardContent>
    </Card>
  );
}

/** Shell only: the five sections and the rail, laid out. Each section is built in its own step. */
function CaseCreationPage() {
  const { t } = useCaseCreationT();

  return (
    <div className="bg-background min-h-screen">
      {/* The prototype says what it is on screen, so a screenshot can't be mistaken for the product. */}
      <div className="bg-muted text-muted-foreground px-6 py-1.5 text-center text-xs">{t('page.prototype_banner')}</div>

      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <h1 className="mb-6 text-2xl font-semibold">{t('page.title')}</h1>

        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6">
          <div className="flex flex-col gap-6">
            <SectionCard index={1} titleKey="analysis" />
            <SectionCard index={2} titleKey="patient" />
            <SectionCard index={3} titleKey="clinical_signs" />
            <SectionCard index={4} titleKey="other_clinical" />
            <h2 className="text-muted-foreground mt-2 text-sm font-semibold uppercase tracking-wide">
              {t('section.optional_sections')}
            </h2>
            <SectionCard index={5} titleKey="family" />
          </div>

          <Card className="sticky top-6">
            <CardContent className="flex flex-col gap-3">
              <Button disabled>{t('rail.create')}</Button>
              <Button variant="outline">{t('rail.save_draft')}</Button>
              <p className="text-muted-foreground text-xs">
                {t('rail.required_count', { done: 0, total: REQUIRED_TOTAL })}
              </p>
              <h3 className="mt-[22px] text-sm font-semibold">{t('rail.summary')}</h3>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default CaseCreationPage;
