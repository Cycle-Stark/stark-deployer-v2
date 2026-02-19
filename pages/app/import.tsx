import { AppLayout } from '@/layouts/AppLayout';
import { ImportContract } from '@/components/ImportContract';

function ImportPage() {
  return (
    <>
      <ImportContract />
    </>
  );
}

ImportPage.PageLayout = AppLayout;
export default ImportPage;
