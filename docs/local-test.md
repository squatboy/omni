# 로컬 테스트 가이드

이 문서는 로컬 환경에서 서비스를 직접 빌드하고 컨테이너를 실행하여 테스트하는 방법을 설명합니다.

## 1. 이미지 빌드

먼저 백엔드와 프론트엔드 이미지를 `local` 태그로 빌드합니다.

```bash
# 백엔드 빌드
docker build -t ghcr.io/squatboy/omni-backend:local ./backend

# 프론트엔드 빌드
docker build -t ghcr.io/squatboy/omni-frontend:local ./frontend
```

## 2. 환경 설정 (.env.local)

`deploy` 디렉토리에 `.env.local` 파일을 생성하고 필요한 설정값을 입력합니다.

```bash
cp deploy/.env.example deploy/.env.local
```

`deploy/.env.local` 수정 예시:
```env
OMNI_VERSION=local
KUBERNETES_API_URL=https://your-k8s-api
KUBERNETES_BEARER_TOKEN=your-token
GITLAB_TOKEN=your-gitlab-token
ARGOCD_TOKEN=your-argocd-token
```

## 3. 필수 리소스 준비

`docker-compose.yml`에서 참조하는 파일들을 준비해야 합니다.

```bash
# 인벤토리 설정 복사
mkdir -p deploy/config
cp deploy/config/inventory.example.json deploy/config/inventory.json

# 인증서 파일 생성 (없을 경우 빈 파일이라도 생성하여 마운트 에러 방지)
mkdir -p deploy/certs
touch deploy/certs/kubernetes-ca.crt
```

## 4. 컨테이너 실행

`deploy` 디렉토리에서 `.env.local` 파일을 지정하여 실행합니다.

```bash
cd deploy
docker-compose --env-file .env.local up -d
```

## 5. 접속 확인

브라우저에서 다음 주소로 접속합니다.

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health) (직접 노출 시)

## 6. 종료 및 정리

```bash
docker-compose down
```
