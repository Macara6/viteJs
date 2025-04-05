
export default class PhotoService {
    getImages() {
      return Promise.resolve([
        { itemImageSrc: 'path/to/image1.jpg', thumbnailImageSrc: 'path/to/thumb1.jpg', alt: 'Image 1', title: 'Image 1' },
        { itemImageSrc: 'path/to/image2.jpg', thumbnailImageSrc: 'path/to/thumb2.jpg', alt: 'Image 2', title: 'Image 2' },
      ]);
    }
  }
  