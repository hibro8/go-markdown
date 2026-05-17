; ============================================================================
; Go Markdown — Windows Installer (NSIS 3)
; Build:  makensis installer\go-markdown.nsi
; Output: bin\GoMarkdown-Setup.exe
; ============================================================================

Unicode true
SetCompressor /SOLID lzma

!include "MUI2.nsh"
!include "FileFunc.nsh"

!define PRODUCT_NAME     "Go Markdown"
!define PRODUCT_PUBLISHER "Go Markdown"
!define PRODUCT_VERSION   "1.0.0"
!define PRODUCT_WEB_SITE  "https://github.com/hibro8/go-markdown"
!define PRODUCT_ICON      "..\appicon.ico"

Name    "${PRODUCT_NAME}"
OutFile "..\bin\GoMarkdown-Setup.exe"
InstallDir "$PROGRAMFILES\GoMarkdown"
RequestExecutionLevel admin
BrandingText "${PRODUCT_NAME} v${PRODUCT_VERSION}"

!define MUI_ABORTWARNING
!define MUI_ICON   "${PRODUCT_ICON}"
!define MUI_UNICON "${PRODUCT_ICON}"

!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP        "${NSISDIR}\Contrib\Graphics\Header\nsis.bmp"
!define MUI_HEADERIMAGE_UNBITMAP      "${NSISDIR}\Contrib\Graphics\Header\nsis.bmp"

!define MUI_WELCOMEFINISHPAGE_BITMAP  "${NSISDIR}\Contrib\Graphics\Wizard\nsis.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\nsis.bmp"

; --- Pages ---
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE     "LICENSE.txt"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; --- Languages (SimpChinese first = default) ---
!insertmacro MUI_LANGUAGE "SimpChinese"
!insertmacro MUI_LANGUAGE "English"

; Section names & descriptions (bilingual via LangString)
LangString SEC_APP_NAME    ${LANG_SIMPCHINESE} "Go Markdown (必需)"
LangString SEC_APP_NAME    ${LANG_ENGLISH}      "Go Markdown (required)"
LangString SEC_SHORTCUT    ${LANG_SIMPCHINESE} "开始菜单快捷方式"
LangString SEC_SHORTCUT    ${LANG_ENGLISH}      "Start Menu Shortcuts"
LangString SEC_DESKTOP     ${LANG_SIMPCHINESE} "桌面快捷方式"
LangString SEC_DESKTOP     ${LANG_ENGLISH}      "Desktop Shortcut"
LangString SEC_ASSOC       ${LANG_SIMPCHINESE} "关联 .md / .markdown 文件"
LangString SEC_ASSOC       ${LANG_ENGLISH}      "Associate .md / .markdown files"
LangString SEC_APP_DESC    ${LANG_SIMPCHINESE} "安装 Go Markdown 主程序及所需文件。"
LangString SEC_APP_DESC    ${LANG_ENGLISH}      "Install Go Markdown application and all required files."
LangString SEC_SHORTCUT_DESC ${LANG_SIMPCHINESE} "在开始菜单创建快捷方式。"
LangString SEC_SHORTCUT_DESC ${LANG_ENGLISH}      "Create shortcuts in the Start Menu."
LangString SEC_DESKTOP_DESC  ${LANG_SIMPCHINESE} "在桌面创建快捷方式。"
LangString SEC_DESKTOP_DESC  ${LANG_ENGLISH}      "Create a shortcut on the Desktop."
LangString SEC_ASSOC_DESC    ${LANG_SIMPCHINESE} "双击 .md 和 .markdown 文件直接用 Go Markdown 打开。"
LangString SEC_ASSOC_DESC    ${LANG_ENGLISH}      "Open .md and .markdown files with Go Markdown on double-click."

; --- Sections ---
InstType "Standard"
InstType "Minimal"

Section $(SEC_APP_NAME) SecApp
  SectionIn 1 2 RO
  SetOutPath "$INSTDIR"
  File "..\bin\go-markdown.exe"
  File "..\appicon.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0

  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayName"     "${PRODUCT_NAME}"
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayVersion"  "${PRODUCT_VERSION}"
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "Publisher"       "${PRODUCT_PUBLISHER}"
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayIcon"     "$\"$INSTDIR\appicon.ico$\""
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "UninstallString" "$\"$INSTDIR\Uninstall.exe$\""
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "QuietUninstallString" "$\"$INSTDIR\Uninstall.exe$\" /S"
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "InstallLocation" "$INSTDIR"
  WriteRegStr   HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "URLInfoAbout"    "${PRODUCT_WEB_SITE}"
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "NoRepair" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "EstimatedSize" $0
SectionEnd

Section $(SEC_SHORTCUT) SecShortcut
  CreateDirectory "$SMPROGRAMS\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"     "$INSTDIR\go-markdown.exe" "" "$INSTDIR\appicon.ico"
  CreateShortCut "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk"            "$INSTDIR\Uninstall.exe"   "" "$INSTDIR\appicon.ico"
SectionEnd

Section $(SEC_DESKTOP) SecDesktop
  CreateShortCut "$DESKTOP\${PRODUCT_NAME}.lnk" "$INSTDIR\go-markdown.exe" "" "$INSTDIR\appicon.ico"
SectionEnd

Section $(SEC_ASSOC) SecAssoc
  ReadRegStr $0 HKCR ".md" ""
  ${If} $0 != ""
    WriteRegStr HKLM "Software\${PRODUCT_NAME}\FileAssocBackup" ".md" $0
  ${EndIf}
  ReadRegStr $0 HKCR ".markdown" ""
  ${If} $0 != ""
    WriteRegStr HKLM "Software\${PRODUCT_NAME}\FileAssocBackup" ".markdown" $0
  ${EndIf}

  WriteRegStr HKLM "Software\Classes\.md"       "" "GoMarkdown.Document"
  WriteRegStr HKLM "Software\Classes\.markdown" "" "GoMarkdown.Document"
  WriteRegStr HKLM "Software\Classes\GoMarkdown.Document"            "" "Markdown Document"
  WriteRegStr HKLM "Software\Classes\GoMarkdown.Document\DefaultIcon" "" "$INSTDIR\appicon.ico"
  WriteRegStr HKLM "Software\Classes\GoMarkdown.Document\shell\open\command" "" '"$INSTDIR\go-markdown.exe" "%1"'
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecApp}     $(SEC_APP_DESC)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecShortcut} $(SEC_SHORTCUT_DESC)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecDesktop}  $(SEC_DESKTOP_DESC)
  !insertmacro MUI_DESCRIPTION_TEXT ${SecAssoc}    $(SEC_ASSOC_DESC)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

; --- Uninstaller ---
Section "Uninstall"
  ReadRegStr $0 HKLM "Software\${PRODUCT_NAME}\FileAssocBackup" ".md"
  ${If} $0 != ""
    WriteRegStr HKLM "Software\Classes\.md" "" $0
  ${Else}
    DeleteRegKey HKLM "Software\Classes\.md"
  ${EndIf}

  ReadRegStr $0 HKLM "Software\${PRODUCT_NAME}\FileAssocBackup" ".markdown"
  ${If} $0 != ""
    WriteRegStr HKLM "Software\Classes\.markdown" "" $0
  ${Else}
    DeleteRegKey HKLM "Software\Classes\.markdown"
  ${EndIf}

  DeleteRegKey HKLM "Software\Classes\GoMarkdown.Document"
  DeleteRegKey HKLM "Software\${PRODUCT_NAME}"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"

  Delete "$SMPROGRAMS\${PRODUCT_NAME}\${PRODUCT_NAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCT_NAME}\Uninstall.lnk"
  RMDir  "$SMPROGRAMS\${PRODUCT_NAME}"
  Delete "$DESKTOP\${PRODUCT_NAME}.lnk"

  Delete "$INSTDIR\go-markdown.exe"
  Delete "$INSTDIR\appicon.ico"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir  "$INSTDIR"

  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
SectionEnd

Function .onInit
  System::Call 'kernel32::CreateMutexW(i 0, i 0, t "GoMarkdownSetupMutex") i .r1 ?e'
  Pop $R0
  ${If} $R0 != 0
    MessageBox MB_OK|MB_ICONEXCLAMATION "Setup is already running."
    Abort
  ${EndIf}
  !insertmacro MUI_LANGDLL_DISPLAY
FunctionEnd

Function .onInstSuccess
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Installation complete. Launch ${PRODUCT_NAME} now?" \
    IDNO +2
  Exec '"$INSTDIR\go-markdown.exe"'
FunctionEnd