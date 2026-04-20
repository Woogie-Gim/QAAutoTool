# QA Auto Tool (Phase 1 - Mobile Prototype)

## Overview
안드로이드 샌드박스 보안 정책을 우회하여, 모바일 디바이스 내에서 타겟 애플리케이션의 실시간 시스템 리소스를 측정하고 분석하는 QA 자동화 프로토타입 앱입니다. Shizuku API를 활용하여 시스템 최고 관리자(ADB) 권한을 획득하고, 실기기 환경에서 별도의 PC 연결 없이 독립적으로 `dumpsys` 쉘 명령어를 실행합니다.

## Tech Stack
- Frontend: React Native, TypeScript
- Backend (Native Bridge): Android, Kotlin
- System IPC: Shizuku API (v12.1.0)

## Core Features
1. 시스템 권한 우회 및 제어
   - Shizuku IPC 통신을 통한 안드로이드 ADB 권한 획득
   - Android 11+ Package Visibility 정책 우회 (Manifest Queries 적용)

2. 실시간 리소스 모니터링
   - `dumpsys meminfo`: 타겟 앱의 메모리 사용량 측정 및 통계 (현재, 최고, 최저 값 산출)
   - `dumpsys cpuinfo`: 기기의 전체 CPU 점유율 측정
   - `dumpsys battery`: 장시간 테스트를 위한 기기 발열(배터리 온도) 측정

3. 데이터 파싱 및 리포트 추출
   - 정규표현식(Regex)을 활용한 방대한 쉘 터미널 로그 파싱
   - 안드로이드 네이티브(Kotlin) `ClipboardManager`를 활용한 외부 라이브러리 없는 클립보드 복사 구현 (요약 리포트 및 전체 원본 로그 선택 가능)

## Technical Architecture
React Native 단에서는 사용자 UI와 정규표현식을 통한 데이터 파싱을 담당하며, 안드로이드 시스템 터미널 접근이 불가능한 한계를 극복하기 위해 Kotlin 기반의 Native Module 브릿지를 직접 설계하였습니다. 이를 통해 JavaScript에서 요청된 쉘 명령어가 Kotlin을 거쳐 Shizuku 프로세스를 통해 실행되고, 반환된 터미널 텍스트 결과를 비동기(Promise) 방식으로 프론트엔드에 전달하는 구조를 가집니다.

## Installation & Usage
1. 사전 준비: 테스트 기기에 Shizuku 공식 앱 설치 및 ADB(또는 무선 디버깅)를 통한 서비스 활성화
2. 앱 설치: 본 프로젝트 빌드 후 기기에 APK 설치 (`npm run android` 또는 `assembleDebug`)
3. 권한 부여: Shizuku 앱 관리 메뉴에서 'QA Auto Tool' 권한 허용
4. 측정 진행: 앱 실행 후 '데이터 수집' 버튼을 클릭하여 리소스 변화량 확인 및 결과 복사

## Retrospective & Next Steps
본 프로젝트는 모바일 네이티브 환경에서의 쉘 명령어 실행 및 프로세스 간 통신(IPC) 메커니즘을 증명하기 위한 아키텍처 검증용으로 성공적으로 개발되었습니다. 

다만, 기기를 재부팅할 때마다 외부(PC)에서 Shizuku 서버를 활성화해야 하는 안드로이드 OS 자체의 권한적 한계가 존재합니다. 따라서 본 프로토타입을 기반으로 얻은 명령어 제어 및 파싱 로직을 활용하여, 향후에는 사용자 개입을 완전히 배제할 수 있는 PC 환경(Node.js 기반)의 중앙 제어식 QA 자동화 툴(Phase 3)로 고도화할 예정입니다.