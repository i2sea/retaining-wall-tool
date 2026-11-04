# 작업 규칙

- 코드는 `index.html` · `style.css` · `js/*.js`로 나뉘어 있다(README의 파일 구성). 고치면 claude.ai 아티팩트 "옹벽 설계도구 · KDS 대조본"(https://claude.ai/artifact/EyPJJxVHVTQmAS1DUddspQ)과 이 저장소를 항상 같이 갱신한다. 커밋 메시지에 아티팩트 버전 번호를 적는다.
- 설계기준을 새로 정하거나 바꾸면 `docs/설계기준_적용사항.md`와 프로젝트 문서 `claude/옹벽_설계기준_적용사항.md`를 같이 고친다.
- 응답은 한국어. 사용자가 표시한 것만 고치고 다른 치수는 건드리지 않는다. 형식별(역T·L·역L) 수정은 그 형식에만 적용한다.
- 아티팩트 게시: `index.html`을 file_path로, `style.css`와 `js/*.js`를 files로 함께 올린다.
- 계산·도면에 영향이 있는 수정 전후에 `tools/regress.py`로 저장된 옹벽 결과를 비교한다.
