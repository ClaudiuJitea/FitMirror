# FitMirror

<div align="center">
  <img src="appimages/2.png" alt="FitMirror Try-On Screen" width="300"/>
  <br/>
  <em>AI-Powered Virtual Try-On Experience</em>
</div>

## Overview

**FitMirror** is a cutting-edge mobile application that revolutionizes online shopping by allowing users to virtually try on clothing items using advanced AI technology. Built with React Native and Expo, it provides a seamless experience for visualizing how clothes will look before making a purchase.

---

## Screenshots

<div align="center">
  <img src="appimages/1.png" alt="Camera Interface" width="250" style="margin: 10px;"/>
  <img src="appimages/2.png" alt="Try-On Generation" width="250" style="margin: 10px;"/>
  <img src="appimages/3.png" alt="Settings Screen" width="250" style="margin: 10px;"/>
</div>

<div align="center">
  <em>Camera Interface • Try-On Generation • Settings & Configuration</em>
</div>

---

## Key Features

### **Core Functionality**
- **Dual-Mode Camera**: Capture user photos and clothing items with intuitive interface
- **AI-Powered Try-On**: Generate realistic virtual try-on results using Fal.ai API
- **Smart Gallery**: Organize and manage captured images with categorized view
- **Local Storage**: Save and share results with seamless device integration

### **User Experience**
- **Clean Material Design**: Modern, intuitive interface with smooth animations
- **Real-Time Processing**: Live camera preview with instant visual feedback
- **Loading States**: Elegant progress indicators and status updates
- **Error Recovery**: Comprehensive error handling with user-friendly messages
- **Cross-Platform**: Native performance on both iOS and Android

### **Technical Excellence**
- **TypeScript**: Full type safety and enhanced developer experience
- **Image Optimization**: Automatic compression, resizing, and format optimization
- **Offline Capability**: Local caching and storage for uninterrupted usage
- **Performance**: Optimized rendering and memory management

---

## Quick Start

### Prerequisites
```bash
# Required tools
- Node.js (v16+)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator

# Required API Keys
- Fal.ai API key (for virtual try-on functionality)
```

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ClaudiuJitea/FitMirror.git
   cd FitMirror
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API key:
   ```env
   # Fal.ai API for virtual try-on (required, set in app settings)
   FAL_API_KEY=your_fal_api_key_here
   
   EXPO_PUBLIC_APP_NAME=FitMirror
   EXPO_PUBLIC_APP_VERSION=1.0.0
   ```

4. **Start development server**
   ```bash
   npx expo start
   ```

5. **Launch on device**
   - **iOS**: Press `i` or scan QR code with Camera app
   - **Android**: Press `a` or scan QR code with Expo Go app
   - **Web**: Press `w` (limited functionality)

---

## Architecture

### Project Structure
```
FitMirror/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Camera interface & capture
│   │   ├── gallery.tsx        # Image gallery & management
│   │   ├── settings.tsx       # App configuration
│   │   └── _layout.tsx        # Tab navigation layout
│   ├── processing.tsx         # AI processing & status
│   ├── result.tsx            # Result display & sharing
│   ├── edit-profile.tsx      # User profile management
│   └── _layout.tsx           # Root navigation layout
├── services/
│   ├── fal.ts                # Fal.ai API integration
│   └── storage.ts            # Local data management
├── components/               # Reusable UI components
├── assets/                   # Images, icons, fonts
└── utils/                    # Helper functions & utilities
```

### Technology Stack
- **Frontend**: React Native, Expo SDK 50+
- **Navigation**: Expo Router (file-based routing)
- **UI Framework**: Native components with custom styling
- **Image Processing**: Expo Image, Image Manipulator
- **AI Integration**: Fal.ai for virtual try-on generation
- **Storage**: AsyncStorage, Expo FileSystem
- **Camera**: Expo Camera, Image Picker
- **Icons**: SF Symbols (iOS) / Material Icons (Android)

---

## AI Integration

FitMirror uses **Fal.ai** for realistic virtual try-on generation:

### Features
- **Virtual Try-On**: Fal.ai nano-banana model for realistic clothing fitting
- **Prompt Engineering**: Optimized prompts for fashion try-on scenarios
- **Error Handling**: Robust fallback mechanisms and retry logic
- **Rate Limiting**: Built-in request throttling and queue management

### API Configuration

**Option 1: Configure via App Settings (Recommended)**
1. Launch the app and go to Settings tab
2. Enter your Fal.ai API key (get one at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys))
3. Test connection using the "Test API Connection" button

**Option 2: Environment Variables**
1. Sign up at [Fal.ai](https://fal.ai/dashboard/keys) for virtual try-on API
2. Add key to `.env` file (see installation steps above)
3. Restart the development server

---

## Usage Guide

### **Taking the Perfect Shot**
1. **Select Mode**: Choose between "Outfit" (clothing item) or "Look" (person)
2. **Frame Subject**: Ensure good lighting and full visibility
3. **Capture**: Use camera button or select from gallery
4. **Review**: Preview and retake if needed

### **Generating Try-Ons**
1. **Upload Images**: Ensure both user photo and clothing item are selected
2. **Process**: Tap "Generate Try-On" and wait for AI processing
3. **Review Result**: View generated image in full-screen mode
4. **Save & Share**: Export to gallery or share on social media

### **Managing Your Gallery**
- **Browse**: View all saved images in organized grid layout
- **Categories**: Filter by user photos, outfits, or AI results
- **Reuse**: Select previous images for new try-on sessions
- **Delete**: Long-press to remove unwanted images

---

## Development

### Running in Development
```bash
# Start with different options
npx expo start                 # Development server
npx expo start --ios          # iOS simulator
npx expo start --android      # Android emulator
npx expo start --web          # Web browser (limited)
npx expo start --tunnel       # Public URL for testing
```

### Building for Production
```bash
# Modern EAS Build (recommended)
npx eas build -p ios          # iOS build
npx eas build -p android      # Android build
npx eas build -p all          # Both platforms

# Legacy Expo Build
npx expo build:ios            # iOS build
npx expo build:android        # Android APK
```

### Testing & Quality Assurance
```bash
# Linting & Code Quality
npx expo lint                  # ESLint check
npm run typecheck             # TypeScript validation

# Testing Features
# - Camera functionality on physical devices
# - API integration with valid keys
# - Offline capabilities
# - Cross-platform compatibility
```

---

## Configuration

### Environment Variables
```env
# Required for virtual try-on (can also be set in app settings)
FAL_API_KEY=your_fal_api_key_here

# App Configuration
EXPO_PUBLIC_APP_NAME=FitMirror
EXPO_PUBLIC_APP_VERSION=1.0.0
```

### App Configuration
Key settings in `app.json`:
```json
{
  "expo": {
    "name": "FitMirror",
    "slug": "fitmirror", 
    "scheme": "fitmirror",
    "platforms": ["ios", "android", "web"]
  }
}
```

---

## Troubleshooting

### Common Issues & Solutions

**Camera Not Working**
- Verify camera permissions in device settings
- Test on physical device (simulators have limited camera support)
- Restart the app if camera appears frozen

**API Connection Failed**
- Verify Fal.ai API key is valid and active
- Check network connectivity and firewall settings
- Review API usage limits and billing status
- Test connection using the "Test API Connection" button in Settings
- Ensure API key is properly entered (no extra spaces or characters)

**App Performance Issues**
- Clear app cache in settings
- Reduce image resolution for faster processing
- Close other apps to free memory
- Update to latest Expo SDK version

**Build Failures**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Update Expo CLI
npm install -g @expo/cli@latest
```

---

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code styling
- Add tests for new features
- Update documentation as needed

---

## Roadmap

### **Short Term (v1.1)**
- [ ] Multiple clothing items support
- [ ] Enhanced AI prompt customization
- [ ] Batch processing capabilities
- [ ] Export quality settings

### **Medium Term (v1.5)**
- [ ] User authentication & cloud sync
- [ ] Social sharing features
- [ ] Outfit recommendation engine
- [ ] Advanced image editing tools

### **Long Term (v2.0)**
- [ ] 3D virtual try-on
- [ ] AR integration
- [ ] Multi-user collaboration
- [ ] Brand partnerships

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

### Powered By
- **[Expo](https://expo.dev/)** - Universal React development platform
- **[Fal.ai](https://fal.ai/)** - AI-powered virtual try-on technology

### Design Inspiration
- **[SF Symbols](https://developer.apple.com/sf-symbols/)** - Beautiful iconography
- **[Material Design](https://material.io/)** - Modern UI patterns
- **[React Native Community](https://reactnative.dev/)** - Development best practices

---

## Support & Contact

### **Issues & Bug Reports**
Create an issue on [GitHub Issues](https://github.com/ClaudiuJitea/FitMirror/issues)

### **Questions & Discussions**
- Check existing [Discussions](https://github.com/ClaudiuJitea/FitMirror/discussions)
- Review [Documentation](https://github.com/ClaudiuJitea/FitMirror/wiki)

### **Additional Resources**
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Fal.ai Documentation](https://fal.ai/docs)

---

<div align="center">
  <strong>Made with cutting-edge AI technology</strong>
  <br/>
  <em>Transform your shopping experience with FitMirror</em>
</div>