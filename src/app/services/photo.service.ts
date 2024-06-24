import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { UserPhoto } from '../model/photo.interface';

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  public photos: UserPhoto[] = [];

  constructor() {}

  public async addNewToGallery() {
    try {
      // Take a photo
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri, // file-based data; provides best performance
        source: CameraSource.Camera, // automatically take a new photo with the camera
        quality: 100 // highest quality (0 to 100)
      });

      // Save the picture and add it to photo collection
      const savedImageFile = await this.savePicture(capturedPhoto);
      if (savedImageFile) {
        this.photos.unshift(savedImageFile);
      } else {
        console.error('No se pudo guardar la imagen.');
      }
    } catch (error) {
      console.error('Error al agregar nueva imagen a la galería: ', error);
    }
  }

  public getPhotos(): UserPhoto[] {
    return this.photos;
  }

  private async savePicture(photo: Photo): Promise<UserPhoto | null> {
    try {
      // Convert photo to base64 format, required by Filesystem API to save
      const base64Data = await this.readAsBase64(photo);

      // Write the file to the data directory
      const fileName = Date.now() + '.jpeg';
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Data
      });

      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: photo.webPath
      };
    } catch (error) {
      console.error('Error al guardar la imagen: ', error);
      return null;
    }
  }

  private async readAsBase64(photo: Photo): Promise<string> {
    try {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();
      return await this.convertBlobToBase64(blob) as string;
    } catch (error) {
      console.error('Error al convertir la imagen a base64: ', error);
      throw error;
    }
  }

  private convertBlobToBase64 = (blob: Blob): Promise<string | ArrayBuffer | null> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });
}
