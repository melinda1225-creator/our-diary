# 교환 일지 — 윈도우 설치 가이드 (README-windows)

윈도우 컴퓨터로 이 사이트를 처음부터 끝까지 설치·배포하는 방법을 순서대로 정리했어요. 이 문서 하나만 보고 따라오면 됩니다. (내용 자체는 `README.md`와 같지만, 명령어와 화면은 전부 윈도우 기준으로 다시 썼어요.)

## 구조 한눈에 보기

- **사이트 코드** (이 프로젝트) → **공개(public) 레포**에 두고 GitHub Pages로 배포합니다. 개인정보가 전혀 없는 정적 웹앱이라 공개해도 괜찮아요.
- **일지 데이터**(글, 댓글, 이미지) → 둘만 볼 수 있는 **private 레포**에 저장합니다. 브라우저가 각자의 개인 액세스 토큰(PAT)으로 이 레포에 직접 읽고 씁니다.
- 토큰은 그 어떤 파일에도 커밋되지 않고, 사용하는 기기의 브라우저에만 저장됩니다.

**꼭 알아두세요**: 함께 쓰는 사람 모두가 각자 자기 GitHub 계정으로 토큰을 발급받아야 해요. 발급받으려면 먼저 데이터 레포에 협업자로 초대되어 있어야 합니다. 아래 순서에 다 들어있어요.

## 0. 사이트 이름 바꾸기 (선택)

배포하기 전에 사이트 이름을 "교환 일지"가 아닌 다른 이름으로 바꾸고 싶다면:

1. 압축을 푼 폴더에서 `src\config.js` 파일을 메모장이나 VS Code로 여세요.
2. 아래 줄의 따옴표 안 텍스트만 원하는 이름으로 바꾸고 저장하세요.
   ```js
   export const SITE_TITLE = '교환 일지'
   ```
3. 같은 파일의 `DIARY_WORD` 값을 바꾸면, 화면 곳곳에 쓰이는 "일지"라는 단어(예: "OO의 일지", "아직 쓴 일지가 없어요")도 "일기" 등 원하는 말로 한 번에 바뀝니다.
   ```js
   export const DIARY_WORD = '일지'
   ```
4. (선택) 검색엔진이나 링크 미리보기에도 새 이름이 보이길 원하면 `index.html` 파일의 `<title>...</title>` 부분도 같이 바꿔주세요.

## 1. Private 데이터 레포 만들기

1. https://github.com 에 로그인하세요. (계정이 없다면 먼저 무료로 가입)
2. 우측 상단 **+** 버튼 → **New repository**
3. 레포 이름을 정하세요. (예: `our-diary-data`)
4. **Private**를 선택하고 **Create repository**를 누르세요.
5. 아무 파일도 미리 만들 필요 없어요. 앱을 처음 실행하면 자동으로 `config.json`, `index.json`을 생성해요.

## 2. 같이 쓸 사람을 협업자로 초대하기

1. 방금 만든 레포 페이지 → **Settings** 탭 → 왼쪽 메뉴 **Collaborators** → **Add people**
2. 상대방의 GitHub 아이디 또는 가입한 이메일을 입력해서 초대를 보내세요.
3. 상대방은 이메일이나 GitHub 알림에서 초대를 확인하고 **Accept invitation**을 눌러야 해요. 수락하기 전에는 다음 단계에서 이 레포가 안 보여요.

## 3. 개인 액세스 토큰(PAT) 발급 — 각자 자기 계정으로 1개씩

레포 소유자를 포함해서, 사용하는 모든 사람이 각자 자기 GitHub 계정에서 아래 과정을 진행해야 해요.

**⚠️ 레포 소유자와 협업자는 발급 방식이 달라요.** GitHub의 Fine-grained 토큰은 아직 "초대받아서 접근 권한만 있는 레포"는 선택할 수 없어요 (GitHub 자체의 알려진 제약). 그래서 소유자는 Fine-grained, 협업자는 Classic 토큰을 써야 해요.

### 레포 소유자

1. GitHub 우측 상단 프로필 사진 클릭 → **Settings**
2. 왼쪽 맨 아래 **Developer settings** 클릭
3. **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
4. **Token name**: 아무 이름이나 (예: "교환일지")
5. **Expiration**: 1년 정도로 설정하거나 "No expiration"(무기한)도 괜찮아요.
6. **Repository access**: "Only select repositories" → 1단계에서 만든 데이터 레포 선택
7. **Permissions** 펼치기 → **Repository permissions** → **Contents**를 **Read and write**로 설정
8. 맨 아래 **Generate token** 클릭
9. `github_pat_...`로 시작하는 토큰이 딱 한 번 보여요. 잊지 말고 복사해두세요.

### 협업자로 초대받은 사람

Fine-grained 토큰 화면에서 "Only select repositories" 옵션이 안 보이고 "Public repositories"/"All repositories"만 있다면 정상이에요 — 협업자는 이 방식을 못 써요. 대신:

1. **Personal access tokens** → 이번엔 **Tokens (classic)** 클릭 (Fine-grained tokens 아님)
2. **Generate new token** → **Generate new token (classic)**
3. Note에 이름 적고, Expiration 설정
4. 체크박스에서 **`repo`** 하나만 체크 (Full control of private repositories — 하위 항목 자동 체크됨)
5. **Generate token** 클릭 후 `ghp_...`로 시작하는 토큰을 복사해두세요.

> 토큰은 비밀번호와 같아서 절대 다른 사람과 공유하지 마세요. 각자 자기 토큰을 자기 브라우저에만 입력합니다.

## 4. Node.js 설치하기

1. https://nodejs.org 접속 → **LTS** 버전의 Windows 설치 파일(.msi)을 다운로드하세요.
2. 다운로드한 파일을 더블클릭해서 실행하고, 계속 "Next"를 눌러 기본값으로 설치하세요.
3. 설치가 끝나면 시작 메뉴에서 **PowerShell**을 검색해서 열고, 아래를 입력해 설치가 잘 됐는지 확인하세요.
   ```powershell
   node -v
   npm -v
   ```
   각각 버전 번호가 출력되면 성공이에요.

## 5. 사이트 코드 압축 풀기

받은 압축 파일(zip)을 다운로드 폴더에서 마우스 오른쪽 클릭 → **"압축 풀기"** 또는 **"모두 추출"**을 눌러 원하는 위치(예: 바탕화면)에 풀어주세요. 폴더 안에 `package.json`, `src` 폴더 등이 보이면 잘 풀린 거예요.

폴더 경로에 한글이나 공백이 많으면 가끔 오류가 날 수 있어요. `C:\projects\exchange-diary`처럼 영문 경로에 두는 걸 추천해요.

## 6. 로컬에서 실행해보기

### 터미널이 처음이라면 (cd 사용법)

PowerShell 같은 터미널은 명령어로 컴퓨터를 조작하는 화면이에요. 꼭 알아야 할 명령은 `cd` 하나뿐이에요. `cd`는 "Change Directory"의 줄임말로, **지금 작업할 폴더로 이동**하는 명령이에요.

- `cd 폴더경로` — 그 폴더로 이동 (예: `cd C:\Users\내이름\Desktop\exchange-diary`)
- `cd ..` — 한 단계 위(부모) 폴더로 이동
- `pwd` (또는 `cd`만 입력) — 지금 어느 폴더에 있는지 확인
- `dir` — 지금 폴더 안에 뭐가 있는지 목록 보기

아래 명령들(`npm install` 등)은 **반드시 이 프로젝트 폴더 안에서** 실행해야 해요. 다른 폴더에서 실행하면 "package.json을 찾을 수 없다"는 식의 에러가 나요. 가장 쉬운 방법은 아래 1~2번처럼 탐색기 주소창을 이용하는 거예요 — 직접 `cd` 명령을 타이핑할 필요 없이 폴더 위치에서 바로 PowerShell이 열려요.

### 실행하기

1. 압축을 푼 `exchange-diary` 폴더를 파일 탐색기에서 여세요.
2. 폴더 안에서 주소창(경로가 써있는 곳)을 클릭하고 `powershell`이라고 입력한 뒤 Enter를 누르면, 그 폴더 위치에서 바로 PowerShell이 열려요.
3. 아래 명령을 순서대로 입력하세요.
   ```powershell
   npm install
   npm run dev
   ```
4. 터미널에 아래처럼 로컬 주소가 출력돼요.
   ```
   VITE v5.4.0  ready in 320 ms
   ➜  Local:   http://localhost:5173/
   ```
5. 이 주소를 크롬 등 브라우저 주소창에 붙여넣으면 사이트가 열립니다.
6. 첫 화면에서 데이터 레포 정보(소유자/레포 이름)와 3단계에서 만든 토큰을 입력하세요. 처음 연결하는 사람이 이름, 색상, 배경색, (선택) 프로필 사진을 정하면 설정이 완료돼요.

> PowerShell에서 `npm run dev`가 "이 시스템에서 스크립트를 실행할 수 없으므로..." 같은 보안 오류를 내면, PowerShell 대신 **명령 프롬프트(cmd)**를 써보세요. 시작 메뉴에서 "cmd"를 검색하면 됩니다. 명령어는 동일하게 입력하면 돼요. 또는 관리자 권한 PowerShell에서 아래 명령을 한 번 실행한 뒤 다시 시도하세요.
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
> ```

## 7. GitHub Pages로 배포하기

### 7-1. 공개 레포 만들고 코드 올리기 (git push)

1. GitHub에서 새 **공개(public)** 레포를 만드세요. (예: `our-diary`) — 이 레포에는 사이트 코드만 올라가고 개인정보는 없어요.
2. Git이 설치되어 있지 않다면 https://git-scm.com/download/win 에서 설치하세요.
3. 프로젝트 폴더에서 PowerShell을 열고, 아직 git 저장소가 아니라면 아래를 순서대로 입력하세요.
   ```powershell
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/<내아이디>/our-diary.git
   git push -u origin main
   ```
   - 이미 `git init`을 했다면 처음 4줄은 건너뛰어도 돼요.
   - "remote origin already exists" 에러가 나면 `add` 대신 `git remote set-url origin https://github.com/<내아이디>/our-diary.git`을 쓰세요.
   - `fatal: not a git repository`가 뜬다면 `git init`을 안 했거나 다른 폴더에 있는 거예요. `pwd` (또는 `cd` 만 입력)로 지금 위치를 확인하고 프로젝트 폴더로 이동한 뒤 다시 시도하세요.

4. **`git push` 시 "Authentication failed"가 뜬다면**: GitHub는 더 이상 계정 비밀번호로 로그인을 지원하지 않아요. **코드를 push하기 위한 용도의 Personal Access Token**을 새로 하나 발급받아야 해요. (일지 로그인용 토큰과는 별개예요!)
   1. GitHub → 프로필 → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens** → **Generate new token**
   2. **Repository access**: 방금 만든 사이트 코드 레포(`our-diary`) 선택
   3. **Permissions** → Repository permissions → **Contents: Read and write**
   4. 토큰을 생성하고 복사해두세요.
   5. `git push -u origin main`을 다시 실행하면 Username/Password를 물어봐요. **Username**엔 GitHub 아이디, **Password**엔 방금 만든 토큰을 붙여넣으세요. (Windows에서는 자격 증명 관리자에 저장되어 다음부턴 안 물어봐요)
   6. 매번 토큰 다루기 번거로우면 [GitHub Desktop](https://desktop.github.com)으로 로그인해서 push하는 방법도 있어요.

   > 이 토큰은 **코드를 올릴 때만** 쓰여요. 만료되거나 없어져도 이미 배포된 사이트나, 사용자들이 로그인할 때 쓰는 토큰(3단계에서 각자 발급받은 것)에는 전혀 영향이 없어요. 나중에 코드를 다시 push할 때만 새로 있으면 됩니다.

### 7-2. Vite 설정 및 배포 명령 실행

1. `vite.config.js` 파일의 `base` 값을 레포 이름에 맞게 수정하세요.
   ```js
   base: '/our-diary/', // 레포 이름이 our-diary가 아니라면 바꿔주세요
   ```
2. PowerShell에서 아래 명령을 입력하세요.
   ```powershell
   npm run deploy
   ```
   이 명령은 `npm run build` 후 `dist` 폴더를 `gh-pages` 브랜치로 올려줍니다. (7-1에서 인증을 이미 마쳤다면 추가 입력 없이 바로 됩니다)
3. 레포 페이지 → **Settings** → **Pages**에서 소스를 `gh-pages` 브랜치로 지정하면 `https://<아이디>.github.io/our-diary/` 로 접속할 수 있어요. (반영까지 1~2분 걸릴 수 있어요)
4. 배포된 주소를 같이 쓸 친구에게 알려주고, `사용법.md`를 함께 전달해주세요. 친구가 아직 협업자 초대를 수락하지 않았거나 토큰이 없다면, 2~3단계부터 안내해주세요.
5. 코드를 나중에 수정하면, 그때마다 `npm run deploy`를 다시 실행해서 배포본을 최신 상태로 갱신하면 돼요.

## 8. 사이트 업데이트하는 방법

새 코드(예: 수정된 파일 전체가 든 zip)를 받았을 때 반영하는 순서예요.

1. **기존 프로젝트 폴더 내용을 새 파일로 덮어쓰세요.** 새로 받은 압축을 풀어서 기존 `exchange-diary` 폴더 위에 그대로 덮어씌우면 돼요. `node_modules` 폴더는 새 zip에 안 들어있으니 신경 쓰지 않아도 돼요.
   > ⚠️ 덮어쓰기 전에, `src\config.js`(사이트 이름)나 `vite.config.js`(`base` 경로)처럼 **직접 수정했던 값이 있다면 미리 메모**해두세요. 새로 받은 파일에는 그 값이 기본값으로 되어 있을 수 있어서, 덮어쓴 뒤 다시 적용해줘야 해요.
2. 프로젝트 폴더 안에서 PowerShell로 혹시 모르니 한 번 더 설치해주세요.
   ```powershell
   npm install
   ```
3. 배포하세요.
   ```powershell
   npm run deploy
   ```
   이 명령이 알아서 `npm run build`로 최신 코드를 빌드하고 `gh-pages` 브랜치에 올려줘요. 1~2분 후 배포된 주소에 반영됩니다.

로컬에서 먼저 확인하고 싶다면 3번 전에 `npm run dev`로 미리 띄워보세요.

## 자주 겪는 문제

- **"npm은 내부 또는 외부 명령... 인식되지 않습니다"** → Node.js 설치가 제대로 안 됐거나, 설치 후 터미널을 새로 열지 않은 경우예요. 터미널을 완전히 닫았다가 다시 열어보세요.
- **PowerShell 스크립트 실행 오류** → 위 6번 항목의 방법대로 cmd를 쓰거나 실행 정책을 바꿔주세요.
- **한글/공백이 섞인 경로 문제** → 프로젝트 폴더를 영문 경로로 옮겨서 다시 시도해보세요.
- **로그인할 때 "레포지토리를 찾을 수 없어요" 오류** → 레포 이름/소유자 철자를 확인하거나, 토큰에 해당 레포에 대한 Contents 읽기/쓰기 권한이 있는지, 협업자 초대를 수락했는지 확인하세요.
- **Fine-grained 토큰 만들 때 레포를 고르는 옵션이 안 보여요** → 협업자로 초대받은 계정이면 정상이에요. Fine-grained 토큰은 아직 협업자 레포를 지원하지 않아요. 3단계의 "협업자로 초대받은 사람" 항목대로 Classic 토큰을 만드세요.
- **`npm run deploy`가 안 될 때** → 먼저 `npm install`을 실행했는지, 그리고 GitHub에 로그인된 상태(Git 자격 증명)인지 확인하세요.

## 기능 / 참고 사항

`README.md`의 "기능"과 "참고 / 한계" 항목과 동일해요. 요약하면:

- 일지 작성/수정/삭제, 오늘의 기분(해시태그), 사진 첨부, 체크리스트, 수면 기록
- 디스코드 스타일 이모지 반응, 사진 첨부 가능한 댓글
- 캘린더 보기(기본 화면) + 사이드바에서 멤버별 모아보기
- 멤버 추가/삭제, 프로필 사진(자르기 가능)·테마 색·배경색 개인 설정
- 이미지는 자동으로 리사이즈/압축되어 저장되고, 토큰은 브라우저에만 저장되니 공용 컴퓨터 사용은 피하세요.
