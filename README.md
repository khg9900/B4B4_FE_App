## 📁 프로젝트 디렉토리 구조 (React Native - 기능 기반 분리)

📁 src/<br>
├── auth/ # 로그인/회원가입 + OAuth<br>
│ ├── screens/ # 로그인 화면, 회원가입 화면<br>
│ ├── api/ # 로그인, 회원가입 요청<br>
│ └── hooks/ # useAuth(), useLogin()<br>
│<br>
├── user/ # 마이페이지, 사용자 정보 조회 등<br>
│ ├── screens/<br>
│ ├── api/<br>
│ └── components/<br>
│<br>
├── volunteer/ # 자원봉사 모집글, 참가, 출석 등<br>
│ ├── screens/<br>
│ ├── api/<br>
│ ├── hooks/<br>
│ └── components/<br>
│<br>
├── report/ # 재난 신고, 공공 대시보드용 화면<br>
│ ├── screens/<br>
│ ├── api/<br>
│ └── components/<br>
│<br>
├── location/ # 지도 기반 기능, 위치 확인 등<br>
│ ├── screens/<br>
│ ├── hooks/ # useCurrentLocation, useShelterMarkers 등<br>
│ ├── api/<br>
│ └── components/<br>
│<br>
├── notification/ # FCM, 알림 관련 로직<br>
│ ├── services/ # 알림 처리 (subscribe/unsubscribe)<br>
│ └── components/<br>
│<br>
├── global/ # 공통 설정, 인터셉터, 에러 처리<br>
│ ├── api/ # axios 인스턴스, 인터셉터<br>
│ ├── context/ # AuthContext, GlobalContext 등<br>
│ ├── constants/ # 색상, 문자열, 공통 스타일<br>
│ └── utils/ # 쿠키 처리, 날짜 포맷 등<br>
│<br>
├── navigation/ # React Navigation 관련<br>
│ ├── StackNavigator.js<br>
│ ├── TabNavigator.js<br>
│ └── AuthNavigator.js<br>
│<br>
└── components/ # 재사용 가능한 UI 컴포넌트 (Button, Modal 등)<br>

---
This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
