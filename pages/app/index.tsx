import { AppLayout } from '@/layouts/AppLayout';
import { DeployContract } from '@/components/DeployContract';

function HomePage() {
  return (
    <>
      <DeployContract />
    </>
  );
}


HomePage.PageLayout = AppLayout;
export default HomePage
