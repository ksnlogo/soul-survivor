# 소울 서바이버 v3.7 - 설치형 PWA

## 포함 파일
- `index.html` : 게임 본체
- `manifest.webmanifest` : 앱 이름, 아이콘, 시작 URL, 화면 모드 정의
- `service-worker.js` : 오프라인 캐시 및 업데이트 처리
- `icons/` : Android / iOS / maskable 앱 아이콘

## 권장 배포 방식
GitHub 저장소 루트에 이 폴더의 파일들을 그대로 업로드하고 GitHub Pages를 활성화합니다.

1. GitHub 새 저장소 생성 (예: `soul-survivor`)
2. 이 폴더 안의 파일/폴더를 저장소 루트에 업로드
3. `Settings → Pages`
4. `Deploy from a branch`
5. `main` / `/(root)` 선택 후 저장
6. 생성된 HTTPS GitHub Pages 주소를 스마트폰에서 엽니다.

## Android 설치
Chrome에서 게임 접속 후 게임 홈 화면의 `📲 앱으로 설치` 버튼을 누릅니다. 버튼이 나타나지 않으면 Chrome 메뉴에서 `앱 설치` 또는 `홈 화면에 추가`를 선택합니다.

## iPhone / iPad 설치
Safari에서 게임 접속 → 공유 버튼 → `홈 화면에 추가` → `추가`를 선택합니다. 게임 홈 화면의 `📲 홈 화면에 설치` 버튼을 누르면 같은 안내가 표시됩니다.

## 오프라인
최초 1회 온라인으로 정상 로드한 뒤에는 앱 셸이 캐시되어 기본 실행이 가능합니다.

## 업데이트
향후 버전 배포 시 `service-worker.js`의 `CACHE_NAME`을 새 버전명으로 변경하면 기존 캐시가 자동 정리됩니다.
