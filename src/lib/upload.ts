import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

export async function uploadImage(file: File, userId: string) {
    const path = `products/${userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, path);

    const snap = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snap.ref);

    return url; // ← これを imageUrl として backend に保存する
}