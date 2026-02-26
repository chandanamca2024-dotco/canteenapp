# Image Upload Guide for Emulator Testing

## Quick Summary

You now have **2 ways** to add images to food items in the admin panel:

| Method | Best For | Steps |
|--------|----------|-------|
| **📷 Pick from Gallery** | Real device testing | Tap button → Select from device photos |
| **🔗 Use URL** | **Fast testing on emulator** | Tap URL button → Paste image link |

---

## Method 1: Using Image URL (Recommended for Emulator) ⭐

**This is the FASTEST way to test while using an emulator:**

### Steps:
1. Open **Add Food Items** in admin panel
2. Tap **"🔗 Use URL"** button
3. Paste an image URL (see examples below)
4. The image preview should appear immediately
5. Fill in other details and save

### Free Image Sources to Use:

**Option A: Food Images (Best)**
```
https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400
https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400
https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400
```

**Option B: Pexels Food Images**
- Visit: https://www.pexels.com/search/food/
- Right-click any image → "Copy image link"
- Paste into the URL field

**Option C: Google Images (Internet Required)**
- Search "food images"
- Right-click image → "Copy image address"
- Paste into the URL field

### Example Working URLs:
```
https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400
https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400
https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400
```

---

## Method 2: Using Gallery Picker (For Android/iOS Emulator)

**If you want to use the gallery picker with emulator:**

### Android Emulator Setup:

#### Option A: Drag & Drop (Easiest)
1. Find an image on your computer
2. Drag the image file → Drop it on the Android emulator window
3. Select **"Camera"** or **"Gallery"** when prompted
4. The image now appears in emulator gallery

#### Option B: Using ADB (Command Line)
```bash
# Make sure emulator is running, then run:
adb push "C:\path\to\your\image.jpg" /sdcard/DCIM/Camera/

# Example with actual path:
adb push "C:\Users\chand\Pictures\food.jpg" /sdcard/DCIM/Camera/
```

Then in emulator:
1. Open Gallery app
2. Find the image in Camera folder
3. Tap "Pick from Gallery" in Add Items screen
4. Select the image

### iOS Simulator Setup:

1. Open Simulator → **Features** → **Photo Library**
2. Drag & drop images into the photo library
3. Tap "Pick from Gallery" in Add Items screen
4. Select the image

---

## Troubleshooting

### "Pick from Gallery" not showing images on emulator?
- ✅ Use **Method 1 (Image URL)** instead - it's instant!
- Or follow Android Emulator setup above to add images via ADB

### Image URL not loading?
- Check URL is **HTTPS** (not HTTP)
- Image must be **publicly accessible**
- Test URL in browser first to confirm it works

### Upload to Supabase failing?
- Image must be under **10MB**
- Check storage bucket name is correct
- Verify Supabase authentication is working

---

## Complete Workflow Example

1. **Open Admin Panel**
2. **Tap ➕ Add Food Items**
3. **In the modal:**
   - Tap **"🔗 Use URL"**
   - Paste: `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400`
   - Wait for image preview to load
   - Enter Item Name: "Biryani"
   - Enter Price: "120"
   - Select Category: "Rice"
   - Enter Stock: "20"
   - Tap **Save Item**
4. **Image uploads to Supabase automatically** ✅
5. Image appears in menu items list with photo!

---

## For Real Device Testing

When you test on your **actual phone**:
- "Pick from Gallery" will access your phone's photo library normally
- "Use URL" still works for web images

---

## Need Help?

If images still aren't showing:
1. Check browser console for errors
2. Verify Supabase storage bucket permissions
3. Use "Use URL" method as backup
4. Test with the example URLs above

Happy testing! 📸
