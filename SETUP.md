# FitMirror Quick Setup Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Make sure you have all required dependencies
npm install

# If you need additional packages for full functionality:
npm install expo-image-manipulator expo-av
```

### 2. Environment Configuration
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env and add your OpenRouter API key:
# EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 3. Start Development Server
```bash
# Start the Expo development server
npx expo start

# Choose your platform:
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Press 'w' for web (limited functionality)
# - Scan QR code with Expo Go app on your device
```

## 📱 Testing the App

### Camera Functionality
1. **Grant Permissions**: Allow camera and media library access
2. **Test Modes**: Switch between "Outfit" and "Look" modes
3. **Image Capture**: Take photos using the camera button
4. **Gallery Access**: Select images from device gallery

### Try-On Generation
1. **Image Processing**: Navigate through the processing flow
2. **API Integration**: Test with actual OpenRouter API (requires valid key)
3. **Error Handling**: Test network errors and invalid inputs
4. **Loading States**: Verify smooth loading animations

### Gallery Management
1. **Grid Layout**: Browse saved images and results
2. **Image Categories**: Test user photos, outfits, and results
3. **Navigation**: Test transitions between screens

## 🔧 Development Tips

### Debugging
- Use React Native Debugger or Flipper
- Check console logs for API responses
- Test on both iOS and Android devices
- Verify permission handling

### Performance
- Images are cached automatically by expo-image
- API calls include retry logic with exponential backoff
- Loading states prevent multiple simultaneous requests

### Customization
- Modify colors in `app/(tabs)/_layout.tsx`
- Update AI prompts in `services/openrouter.ts`
- Add new image processing features in `utils/imageUtils.ts`

## 🚨 Common Issues

### Camera Not Working
- Ensure device has camera access
- Test on physical device (simulators have limited camera support)
- Check camera permissions in device settings

### API Errors
- Verify OpenRouter API key is valid
- Check network connectivity
- Review API usage limits
- Test with mock responses first

### Build Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall
- Update Expo CLI: `npm install -g @expo/cli`

## 📦 Production Build

### iOS
```bash
# Build for iOS App Store
npx expo build:ios

# Or use EAS Build (recommended)
npx eas build -p ios
```

### Android
```bash
# Build APK for Android
npx expo build:android

# Or use EAS Build (recommended)
npx eas build -p android
```

## 🔐 Security Notes

- Keep API keys secure and never commit them to version control
- Use environment variables for sensitive configuration
- Consider implementing user authentication for production
- Add rate limiting for API calls to prevent abuse

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [OpenRouter API Docs](https://openrouter.ai/docs)
- [Camera API Reference](https://docs.expo.dev/versions/latest/sdk/camera/)
