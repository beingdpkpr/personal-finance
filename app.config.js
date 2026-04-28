export default {
  expo: {
    name: 'Finance',
    slug: 'personal-finance',
    version: '1.0.0',
    scheme: 'finance',
    userInterfaceStyle: 'dark',
    platforms: ['ios', 'android', 'web'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.personal.finance',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: 'com.personal.finance',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0b0c14',
      },
    },
    web: {
      bundler: 'metro',
      output: 'static',
    },
    plugins: ['expo-router', 'expo-font'],
    experiments: {
      typedRoutes: true,
      baseUrl: '/personal-finance',
    },
    extra: {
      router: {},
      eas: {
        projectId: 'bb468e0c-a0cb-4459-aa35-836c33f68a02',
      },
    },
  },
};
