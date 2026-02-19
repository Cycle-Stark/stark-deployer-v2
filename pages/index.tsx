import DefaultMainLayout from '@/layouts/DefaultMainLayout';
import LandingPage from '@/components/landing/LandingPage';

function HomePage() {
  return <LandingPage />;
}

HomePage.PageLayout = DefaultMainLayout;
export default HomePage;
