import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImprovedMapView from './ImprovedMapView';

export default function MapPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <ImprovedMapView />
      </div>
      <Footer />
    </div>
  );
}
