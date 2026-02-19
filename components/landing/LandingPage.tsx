import HeroSection from './HeroSection';
import StatsSection from './StatsSection';
import FeaturesSection from './FeaturesSection';
import NetworksSection from './NetworksSection';
import HowItWorksSection from './HowItWorksSection';
import WalletSection from './WalletSection';
import ScreenshotSection from './ScreenshotSection';
import OpenSourceSection from './OpenSourceSection';
import FAQSection from './FAQSection';
import CTASection from './CTASection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <NetworksSection />
      <HowItWorksSection />
      <WalletSection />
      <ScreenshotSection />
      <OpenSourceSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
