# EGDesk Project State Preservation Rules

## 모든 탭 및 검색 화면의 상태 보존 의무화
- 본 프로젝트에 구현되는 모든 대장, 대시보드, 또는 기능 탭(Tab) 전환이 있는 페이지는 사용자가 페이지를 이탈했다가 돌아왔을 때 보던 상태가 초기화되지 않아야 합니다.
- 이를 위해 브라우저 `sessionStorage`와 연동되는 커스텀 훅인 `usePersistedState` (`@/hooks/usePersistedState`)를 기본적으로 적용해야 합니다.
- **적용 대상 상태**:
  - 메인 탭(activeTab) 및 하위 서브 탭(subTab) 상태
  - 사용자가 입력한 검색어(searchQuery, searchKey 등)
  - 페이징 관련 상태(currentPage, page 등)
  - 상세 모달 활성화 여부 및 선택된 행 ID 등
- **하이드레이션 방지 및 가드**:
  - `usePersistedState`를 적용할 때 브라우저 저장소가 복원되기 전에 데이터를 페칭하여 이중 호출(중복 API 쿼리)이 발생하지 않도록, `useEffect` 상단에 `isRestored` 플래그를 체크하여 얼리 리턴(Return Guard) 처리를 반드시 탑재하십시오.
