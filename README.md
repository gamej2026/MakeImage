# AI Image Generator 🎨

Azure OpenAI GPT image 1.5 (DALL-E 3)를 사용하여 이미지를 생성하는 프로페셔널한 웹 애플리케이션입니다.

## 🌐 서비스 URL

**이 서비스는 GitHub Pages를 통해서만 제공됩니다:**
👉 **https://gamej2026.github.io/MakeImage/**

![AI Image Generator](https://github.com/user-attachments/assets/ab4920d5-e01f-4b94-b7f0-40f5a1edcde7)

**새로운 이미지 편집 기능:**

![Image Editing Mode](https://github.com/user-attachments/assets/4602b0db-e175-4a13-846e-b99d9c9c1ee9)

## ✨ 주요 기능

### 완전한 API 제어
- **Azure OpenAI 설정**: Endpoint, API Key, Deployment Name, API Version 완전 설정 가능
- **GitHub Secrets 지원**: 배포 시 GitHub Secrets에서 자동으로 설정 로드
- **이미지 생성 파라미터**:
  - 📝 **Prompt**: 상세한 이미지 설명 입력
  - 🖼️ **Generation Mode**: Text-only, Image + Text (참조 이미지), Image Editing (인페인팅)
  - 📐 **Size**: 1024x1024 (정사각형), 1792x1024 (가로), 1024x1792 (세로)
  - 🎯 **Quality**: Standard, HD (고화질)
  - 🎨 **Style**: Vivid, Natural, Artistic, Photorealistic, Cinematic, Anime, Watercolor, Oil Painting, Sketch, 3D Render, Custom (사용자 정의 스타일)
  - 🔢 **Number of Images**: 1-10개 동시 생성

### 새로운 기능 (v3.0)
- ✅ **이미지 편집 (인페인팅)**: 이미지의 특정 영역을 마스크하고 AI로 재생성
- ✅ **마스크 에디터**: 브러시/지우개 도구로 편집 영역 직접 그리기
- ✅ **이미지 입력 지원**: 기존 이미지를 업로드하여 편집 가능
- ✅ **Azure OpenAI 이미지 편집 API 통합**: /images/edits 엔드포인트 지원

### 이전 기능 (v2.0)
- ✅ **GitHub Secrets 통합**: AZURE_OPENAI_ENDPOINT, DEPLOYMENT_NAME, API_KEY를 GitHub Secrets에서 자동 로드
- ✅ **향상된 로깅**: 개발자 콘솔에 의미 있는 진행 상황 로그 출력
- ✅ **Image + Text Prompt**: 참조 이미지를 업로드하여 이미지 기반 생성 가능

### 2026 최신 트렌드 UI/UX
- 🌌 **Glassmorphism 디자인**: 현대적인 유리 효과와 블러 처리
- 🎨 **그라디언트 컬러**: 세련된 보라색/파란색 그라디언트
- ✨ **부드러운 애니메이션**: 모든 인터랙션에 부드러운 전환 효과
- 📱 **완전 반응형**: 모든 디바이스에서 완벽한 경험
- 🌙 **다크 모드**: 눈의 피로를 줄이는 다크 테마

### 편의 기능
- 💾 **설정 저장/불러오기**: 로컬 스토리지에 설정 저장
- 📥 **이미지 다운로드**: 생성된 이미지 즉시 다운로드
- 📋 **프롬프트 복사**: 프롬프트를 클립보드에 복사
- 📊 **실시간 상태 표시**: 로딩 상태 및 오류 메시지
- 🖼️ **이미지 갤러리**: 생성된 모든 이미지 히스토리 보관
- 🐛 **디버깅 로그**: 콘솔에서 모든 작업 단계 추적 가능

## 🚀 사용 방법

### 1. 웹사이트 접속

**이 애플리케이션은 GitHub Pages를 통해서만 서비스됩니다.**

👉 **https://gamej2026.github.io/MakeImage/** 에서 바로 사용하세요!

#### GitHub Pages 배포 설정 (저장소 관리자용)
1. GitHub 저장소 Settings > Secrets and variables > Actions
2. 다음 Secrets 추가:
   - `AZURE_OPENAI_ENDPOINT`: Azure OpenAI 엔드포인트 (예: `https://your-resource.openai.azure.com`)
   - `DEPLOYMENT_NAME`: DALL-E 3 배포 이름 (예: `dall-e-3`)
   - `AZURE_OPENAI_API_KEY`: Azure OpenAI API 키
3. Settings > Pages에서 Source를 `main` 브랜치로 설정
4. GitHub Actions가 자동으로 배포
5. `https://[username].github.io/MakeImage/` 에서 접속

> ⚠️ **참고**: 로컬 실행은 지원하지 않습니다. GitHub Pages를 통해 서비스를 이용해주세요.

### 2. Azure OpenAI 설정

1. **Azure Portal에서 OpenAI 리소스 생성**
   - [Azure Portal](https://portal.azure.com)에서 Azure OpenAI 리소스 생성
   - DALL-E 3 모델 배포

2. **설정 입력**
   - **Endpoint**: `https://your-resource.openai.azure.com`
   - **API Key**: Azure Portal의 "Keys and Endpoint"에서 확인
   - **Deployment Name**: 배포한 DALL-E 3 모델 이름 (예: `dall-e-3`)
   - **API Version**: `2024-02-01` (최신 버전)

3. **설정 저장**
   - "Save Config" 버튼을 클릭하여 설정을 로컬에 저장
   - 다음 방문 시 자동으로 불러옴

### 3. 이미지 생성

#### Text to Image (기본)
1. **Generation Mode**: "Text to Image" 선택
2. **프롬프트 입력**: 원하는 이미지를 상세히 설명
3. **파라미터 선택**: 크기, 품질, 스타일, 개수 설정
4. **"Generate Image" 클릭**: 이미지 생성 시작
5. **결과 확인**: 생성된 이미지가 갤러리에 표시됨

#### Image + Text (참조 이미지 기반)
1. **Generation Mode**: "Image + Text (Reference Image)" 선택
2. **참조 이미지 업로드**: "Upload Image" 버튼 클릭하여 이미지 업로드
3. **프롬프트 입력**: 참조 이미지의 스타일이나 구도를 설명하고 원하는 변형 설명
4. **"Generate Image" 클릭**: 프롬프트를 기반으로 새 이미지 생성

**⚠️ 중요 사항**: 
- Azure DALL-E 3 API는 직접적인 이미지 입력을 지원하지 않습니다
- 업로드된 참조 이미지는 사용자가 원하는 것을 시각화하고 더 나은 프롬프트를 작성하는 데 도움을 주는 용도입니다
- 실제 API 호출 시 이미지 데이터는 전송되지 않으며, 프롬프트만 사용됩니다

#### Image Editing (인페인팅) - 새로운 기능!
1. **Generation Mode**: "Image Editing (Inpainting)" 선택
2. **이미지 업로드**: "Upload Image" 버튼 클릭하여 편집할 이미지 업로드
3. **마스크 그리기**: 
   - 편집하고 싶은 영역을 브러시로 그리기
   - 실수한 경우 지우개 도구로 수정
   - 브러시 크기 조절 가능
   - "Clear" 버튼으로 마스크 전체 삭제
4. **프롬프트 입력**: 마스크된 영역에 생성하고 싶은 내용 설명
5. **"Generate Image" 클릭**: 마스크된 영역이 프롬프트에 따라 재생성됨

**🎨 사용 예시**:
- 사진에서 배경 교체하기
- 이미지에 새로운 객체 추가하기
- 이미지의 특정 부분 수정하기
- 불필요한 요소 제거하고 자연스럽게 채우기

**⚠️ 알아두기**: 
- Azure OpenAI DALL-E 이미지 편집 API를 사용합니다
- 마스크된 영역(흰색으로 표시)만 재생성됩니다
- 최상의 결과를 위해 명확한 프롬프트를 작성하세요

### 4. 이미지 관리

- **다운로드**: 각 이미지 카드의 "Download" 버튼 클릭
- **프롬프트 복사**: "Copy Prompt" 버튼으로 사용한 프롬프트 복사

### 5. 디버깅

개발자 도구(F12)의 콘솔 탭을 열면 다음과 같은 상세 로그를 확인할 수 있습니다:
- 설정 로드 및 검증
- API 요청 상세 정보
- 응답 처리 과정
- 에러 발생 시 상세 정보

## 🛠️ 기술 스택

- **Frontend**: Vanilla JavaScript (프레임워크 없이 순수 JS)
- **Styling**: CSS3 (Glassmorphism, Gradients, Animations)
- **API**: Azure OpenAI REST API
- **Storage**: LocalStorage (설정 저장)
- **Deployment**: GitHub Actions + GitHub Pages

## 📋 지원하는 API 파라미터

### 필수 파라미터
- `prompt` (string): 생성할 이미지 설명

### 선택 파라미터
- `size` (string): 이미지 크기
  - `1024x1024`: 정사각형 (기본값)
  - `1792x1024`: 가로형
  - `1024x1792`: 세로형
  
- `quality` (string): 이미지 품질
  - `standard`: 표준 품질 (기본값)
  - `hd`: 고화질
  
- `style` (string): 이미지 스타일
  - `vivid`: 생생하고 극적인 스타일 (기본값)
  - `natural`: 자연스러운 스타일
  - `artistic`: 회화적이고 창의적인 스타일
  - `photorealistic`: 사진과 같은 사실적인 스타일
  - `cinematic`: 영화 같은 품질
  - `anime`: 일본 애니메이션 스타일
  - `watercolor`: 부드러운 수채화 스타일
  - `oil-painting`: 클래식 유화 스타일
  - `sketch`: 손으로 그린 스케치
  - `3d-render`: 3D 컴퓨터 그래픽스
  - `custom`: 사용자 정의 스타일 (직접 입력)
  
- `n` (integer): 생성할 이미지 개수
  - 범위: 1-10 (기본값: 1)

## 🔒 보안 및 개인정보

### GitHub Pages 배포 시 (GitHub Secrets 사용)
- ✅ GitHub Secrets를 통한 안전한 배포
- ⚠️ **중요**: 배포된 JavaScript 파일에 credentials가 포함되므로, 공개 저장소의 경우 누구나 소스를 볼 수 있습니다
- ⚠️ **권장**: 프로덕션 환경에서는 백엔드 프록시를 통해 API 호출을 하거나, 비공개 배포를 사용하세요
- ℹ️ 개인 프로젝트나 테스트 목적으로는 GitHub Secrets 방식이 편리합니다

### 로컬 사용 시
- ✅ API Key는 **로컬 브라우저에만 저장**됨 (LocalStorage)
- ✅ 서버로 전송되지 않음
- ✅ Azure OpenAI API와 직접 통신
- ⚠️ 공용 컴퓨터에서는 사용 후 설정 삭제 권장

### 프로덕션 보안 권장사항
프로덕션 환경에서는 다음 방법을 권장합니다:
1. 백엔드 서버를 구축하여 API 호출 프록시 역할 수행
2. 서버 측에서 Azure OpenAI API 키 관리
3. 클라이언트는 자체 백엔드 API만 호출
4. 인증/권한 부여 시스템 구현

## 🎨 UI/UX 특징

### 2026 디자인 트렌드
- **Glassmorphism**: 반투명 배경과 블러 효과
- **Neumorphism Elements**: 부드러운 그림자와 입체감
- **Micro-interactions**: 모든 버튼과 입력에 피드백
- **Smooth Transitions**: 300ms의 부드러운 전환
- **Gradient Accents**: 보라색-파란색 그라디언트
- **Dark Theme**: 눈의 피로를 줄이는 다크 모드

### 반응형 디자인
- 📱 Mobile: 1단 레이아웃
- 💻 Tablet: 1단 레이아웃
- 🖥️ Desktop: 2단 레이아웃 (설정 | 결과)

## 🌟 프로젝트 구조

```
MakeImage/
├── index.html           # 메인 HTML 구조
├── styles.css           # 스타일시트 (Glassmorphism, 애니메이션)
├── script.js            # JavaScript 로직 (API 연동, UI 컨트롤)
├── config.js            # 설정 파일 (배포 시 자동 생성)
├── .github/
│   └── workflows/
│       └── static.yml   # GitHub Actions 배포 워크플로우
└── README.md            # 문서
```

## 💡 사용 팁

1. **프롬프트 작성**: 구체적이고 상세할수록 좋은 결과
2. **HD 품질**: 중요한 이미지는 HD 품질 선택
3. **스타일 선택**: 
   - **Vivid**: 포스터, 광고, 예술작품 - 생생하고 극적인 결과
   - **Natural**: 사진, 일상적인 장면 - 자연스럽고 사실적
   - **Artistic**: 회화 같은 창의적인 표현
   - **Photorealistic**: 실제 사진처럼 사실적인 이미지
   - **Cinematic**: 영화 같은 극적인 조명과 구도
   - **Anime**: 일본 애니메이션 스타일
   - **Watercolor/Oil Painting**: 전통적인 회화 스타일
   - **Sketch**: 손그림 스케치 느낌
   - **3D Render**: 3D 그래픽스 스타일
   - **Custom**: 원하는 스타일을 직접 입력 (예: "빈티지 만화책 스타일", "네온 사이버펑크")
4. **배치 생성**: 여러 변형을 한 번에 생성하여 최선의 결과 선택
5. **참조 이미지**: 기존 이미지의 스타일이나 구도를 참조하고 싶을 때 사용
6. **사용자 정의 스타일**: Custom 옵션을 선택하고 원하는 스타일을 자세히 설명하면 더 독특한 결과를 얻을 수 있습니다

## 🐛 문제 해결

### Generate Image 버튼이 반응하지 않을 때
1. 브라우저 개발자 도구(F12) 열기
2. Console 탭에서 에러 메시지 확인
3. 모든 필수 설정이 입력되었는지 확인
4. API 엔드포인트 형식이 올바른지 확인

### API 에러 발생 시
- Console 로그에서 상세한 에러 정보 확인
- Azure Portal에서 API Key와 Endpoint가 올바른지 확인
- 배포 이름(Deployment Name)이 정확한지 확인
- API 버전이 최신인지 확인

## 📝 변경 사항 (v2.0)

### 추가된 기능
- ✅ GitHub Secrets 통합으로 안전한 자격 증명 관리
- ✅ 의미 있는 콘솔 로그로 디버깅 개선
- ✅ Image + Text Prompt 모드 추가
- ✅ 참조 이미지 업로드 기능
- ✅ 향상된 에러 처리 및 상태 표시

### 제한 사항
- ❌ Inpainting/Outpainting: Azure DALL-E 3 API가 아직 지원하지 않음
- ℹ️ 참조 이미지 기능은 프롬프트 컨텍스트로만 작동 (직접 편집 불가)

## 🔗 참고 자료

- [Azure OpenAI 문서](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [DALL-E 3 가이드](https://learn.microsoft.com/en-us/azure/ai-services/openai/dall-e-quickstart)
- [API 레퍼런스](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference)

## 📄 라이선스

MIT License

## 🤝 기여

이슈와 풀 리퀘스트는 언제나 환영합니다!

---

**© 2026 AI Image Generator | Powered by Azure OpenAI**
