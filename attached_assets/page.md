import { getImageData } from '@/lib/data';
import { ImageViewer } from '@/components/image-viewer';
import { GoogleDriveImageViewer } from '@/components/google-drive-image-viewer';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function Home() {
  const profiles = await getImageData();

  const sampleDriveLinks = [
    "https://drive.google.com/file/d/1JqzzF-TNlzaLNvKBwpDXkx_IchIVdZQf/view?usp=drive_link",
    "https://drive.google.com/file/d/14fPL9z9E_Ry23fZD_siA_UrI0N07Fxqq/view?usp=sharing"
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="py-6">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold font-headline tracking-tight text-primary sm:text-5xl lg:text-6xl">
            ImageFetcher
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Dynamically displaying images from Google Sheets and Google Drive.
          </p>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 pb-10">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0 sm:p-2">
            <ImageViewer profiles={profiles} />
            <Separator className="my-8" />
            <GoogleDriveImageViewer imageUrls={sampleDriveLinks} />
          </CardContent>
        </Card>
      </main>
      <footer className="py-4">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>Powered by Next.js, Google Sheets, and Google Drive</p>
          </div>
      </footer>
    </div>
  );
}
