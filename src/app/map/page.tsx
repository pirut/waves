import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImprovedMapView from './ImprovedMapView';

export default function MapPage() {
  return (
    <>
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 min-h-0">
          <ImprovedMapView />
        </div>
      </div>
      <Footer />
    </>
  );
}
