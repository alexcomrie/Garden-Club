// Test script for Google Drive URL conversion

// Import the BusinessService
import { BusinessService } from './services/business-service';

// Test URLs
const testUrls = [
  'https://drive.google.com/file/d/1JqzzF-TNlzaLNvKBwpDXkx_IchIVdZQf/view?usp=drive_link',
  'https://drive.google.com/file/d/14fPL9z9E_Ry23fZD_siA_UrI0N07Fxqq/view?usp=sharing',
  'https://drive.google.com/d/1JqzzF-TNlzaLNvKBwpDXkx_IchIVdZQf/view',
  'https://example.com/image.jpg'
];

// Test the conversion function
console.log('Testing Google Drive URL conversion:');
testUrls.forEach(url => {
  const convertedUrl = BusinessService.getDirectImageUrl(url);
  console.log(`Original: ${url}`);
  console.log(`Converted: ${convertedUrl}`);
  console.log('---');
});