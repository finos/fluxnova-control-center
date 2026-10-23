@echo off
rem =====================================================================
rem Fluxnova OpenAPI client generator - Windows port
rem Mirrors scripts/generate-fluxnova-client.sh
rem
rem Usage:  scripts\generate-fluxnova-client.bat [options]
rem =====================================================================

setlocal EnableExtensions

set "SCRIPT_NAME=%~nx0"

if not exist "%~dp0..\" goto :no_project_root
pushd "%~dp0.." >nul

set "OUTPUT_DIR=apps/server/src/fluxnova/generated"
set "OPENAPI_VERSIONS_DIR=node_modules\@openapitools\openapi-generator-cli\versions"

where node >nul 2>&1
if errorlevel 1 goto :no_node

call :get_version_from_package_json fluxnova
if errorlevel 1 goto :fail
set "FLUXNOVA_VERSION=%VERSION%"

call :get_version_from_package_json openApiGenerator
if errorlevel 1 goto :fail
set "OPENAPI_GENERATOR_VERSION=%VERSION%"

rem ---------------------------------------------------------------------
rem Argument parsing
rem ---------------------------------------------------------------------
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--fxn-artifact-repo" goto :opt_repo
if /i "%~1"=="--fxn-artifact-repo-user" goto :opt_user
if /i "%~1"=="--fxn-artifact-repo-token" goto :opt_token
if /i "%~1"=="--fxn-artifact-repo-pass" goto :opt_pass
if /i "%~1"=="--fluxnova-version" goto :opt_version
if /i "%~1"=="--output-dir" goto :opt_output
if /i "%~1"=="-h" goto :opt_help
if /i "%~1"=="--help" goto :opt_help
echo Unknown option: %~1
call :show_usage
goto :fail

:opt_repo
if "%~2"=="" goto :missing_value
set "ARG_FXN_ARTIFACT_REPO=%~2"
shift
shift
goto :parse_args

:opt_user
if "%~2"=="" goto :missing_value
set "ARG_FXN_ARTIFACT_REPO_USER=%~2"
shift
shift
goto :parse_args

:opt_token
if "%~2"=="" goto :missing_value
set "ARG_FXN_ARTIFACT_REPO_TOKEN=%~2"
shift
shift
goto :parse_args

:opt_pass
if "%~2"=="" goto :missing_value
set "ARG_FXN_ARTIFACT_REPO_PASS=%~2"
shift
shift
goto :parse_args

:opt_version
if "%~2"=="" goto :missing_value
set "FLUXNOVA_VERSION=%~2"
shift
shift
goto :parse_args

:opt_output
if "%~2"=="" goto :missing_value
set "OUTPUT_DIR=%~2"
shift
shift
goto :parse_args

:opt_help
call :show_usage
popd
exit /b 0

:missing_value
echo Missing value for option: %~1
call :show_usage
goto :fail

rem ---------------------------------------------------------------------
rem Resolve FXN_* settings: command line wins, then environment
rem ---------------------------------------------------------------------
:args_done
if defined ARG_FXN_ARTIFACT_REPO set "FXN_ARTIFACT_REPO=%ARG_FXN_ARTIFACT_REPO%"
if defined ARG_FXN_ARTIFACT_REPO_USER set "FXN_ARTIFACT_REPO_USER=%ARG_FXN_ARTIFACT_REPO_USER%"
if defined ARG_FXN_ARTIFACT_REPO_TOKEN set "FXN_ARTIFACT_REPO_TOKEN=%ARG_FXN_ARTIFACT_REPO_TOKEN%"
if defined ARG_FXN_ARTIFACT_REPO_PASS set "FXN_ARTIFACT_REPO_PASS=%ARG_FXN_ARTIFACT_REPO_PASS%"

rem ---------------------------------------------------------------------
rem Clean previously downloaded OpenAPI Generator versions (keep folder)
rem ---------------------------------------------------------------------
if exist "%OPENAPI_VERSIONS_DIR%\" goto :clean_versions
echo OpenAPI versions directory not found at %OPENAPI_VERSIONS_DIR% (this is normal for first run)
goto :download_setup

:clean_versions
echo Cleaning up previous OpenAPI Generator versions...
del /f /q "%OPENAPI_VERSIONS_DIR%\*.*" >nul 2>&1
for /d %%d in ("%OPENAPI_VERSIONS_DIR%\*") do rd /s /q "%%d" >nul 2>&1
if errorlevel 1 echo Warning: Failed to clean up %OPENAPI_VERSIONS_DIR%
if not errorlevel 1 echo Successfully cleaned up %OPENAPI_VERSIONS_DIR%

rem ---------------------------------------------------------------------
rem Build repository URL and authentication prefix
rem ---------------------------------------------------------------------
:download_setup
set "TEMP_JAR=%TEMP%\fluxnova-openapi-%RANDOM%%RANDOM%.jar"
set "AUTH_PREFIX="

if defined FXN_ARTIFACT_REPO goto :custom_repo
echo Configuring download using default Maven repository...
set "REPO_BASE=repo1.maven.org/maven2"
goto :do_download

:custom_repo
set "REPO_BASE=%FXN_ARTIFACT_REPO%"
if defined FXN_ARTIFACT_REPO_USER goto :auth_check
echo Configuring download using custom repository (no authentication)...
goto :do_download

:auth_check
if defined FXN_ARTIFACT_REPO_TOKEN goto :use_token
if defined FXN_ARTIFACT_REPO_PASS goto :use_pass
echo Warning: Username provided without token or password. No authentication will be used.
goto :do_download

:use_token
echo Configuring download using custom repository with token authentication...
set "AUTH_PREFIX=%FXN_ARTIFACT_REPO_USER%:%FXN_ARTIFACT_REPO_TOKEN%@"
goto :do_download

:use_pass
echo Configuring download using custom repository with password authentication...
set "AUTH_PREFIX=%FXN_ARTIFACT_REPO_USER%:%FXN_ARTIFACT_REPO_PASS%@"
goto :do_download

rem ---------------------------------------------------------------------
rem Download the Fluxnova OpenAPI jar
rem ---------------------------------------------------------------------
:do_download
set "FLUXNOVA_ARTIFACT_PATH=org/finos/fluxnova/bpm/fluxnova-engine-rest-openapi/%FLUXNOVA_VERSION%/fluxnova-engine-rest-openapi-%FLUXNOVA_VERSION%.jar"
set "FULL_URL=https://%AUTH_PREFIX%%REPO_BASE%/%FLUXNOVA_ARTIFACT_PATH%"

echo Downloading Fluxnova OpenAPI spec version %FLUXNOVA_VERSION%...

where curl >nul 2>&1
if errorlevel 1 goto :no_curl

curl -sSfL "%FULL_URL%" -o "%TEMP_JAR%"
if errorlevel 1 goto :download_failed
if not exist "%TEMP_JAR%" goto :download_failed
for %%f in ("%TEMP_JAR%") do if %%~zf EQU 0 goto :download_failed
goto :extract

:download_failed
echo Failed to download JAR file or file is empty.
if exist "%TEMP_JAR%" del /f /q "%TEMP_JAR%" >nul 2>&1
goto :fail

rem ---------------------------------------------------------------------
rem Extract openapi.json from the jar (zip): tar first, PowerShell fallback
rem ---------------------------------------------------------------------
:extract
echo Extracting OpenAPI spec from JAR...
set "EXTRACT_DIR=%TEMP%\fluxnova-openapi-%RANDOM%%RANDOM%"
mkdir "%EXTRACT_DIR%" >nul 2>&1
set "EXTRACTED_OK="

where tar >nul 2>&1
if errorlevel 1 goto :extract_via_powershell
tar -xf "%TEMP_JAR%" -C "%EXTRACT_DIR%" openapi.json >nul 2>&1
if exist "%EXTRACT_DIR%\openapi.json" set "EXTRACTED_OK=1"

:extract_via_powershell
if defined EXTRACTED_OK goto :extract_done
powershell -NoProfile -NonInteractive -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('%TEMP_JAR%'); $entry = $zip.Entries | Where-Object { $_.FullName -eq 'openapi.json' }; if ($entry) { [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, '%EXTRACT_DIR%\openapi.json', $true) }; $zip.Dispose()" >nul 2>&1
if exist "%EXTRACT_DIR%\openapi.json" set "EXTRACTED_OK=1"

:extract_done
if not defined EXTRACTED_OK goto :extract_failed
move /y "%EXTRACT_DIR%\openapi.json" "fluxnova-openapi.json" >nul
if not exist "fluxnova-openapi.json" goto :extract_failed
rd /s /q "%EXTRACT_DIR%" >nul 2>&1

echo Removing temporary JAR file...
del /f /q "%TEMP_JAR%" >nul 2>&1

if defined EXTRACTED_OK goto :write_config

:extract_failed
echo Failed to extract OpenAPI spec from JAR
if exist "%EXTRACT_DIR%" rd /s /q "%EXTRACT_DIR%" >nul 2>&1
if exist "%TEMP_JAR%" del /f /q "%TEMP_JAR%" >nul 2>&1
goto :fail
rem ---------------------------------------------------------------------
rem Write openapitools.json
rem ---------------------------------------------------------------------
:write_config
if defined FXN_ARTIFACT_REPO goto :config_custom
echo Generating openapitools.json with default repository...
(
  echo {
  echo   "$schema": "./node_modules/@openapitools/openapi-generator-cli/config.schema.json",
  echo   "spaces": 2,
  echo   "generator-cli": {
  echo     "version": "%OPENAPI_GENERATOR_VERSION%"
  echo   }
  echo }
) > "openapitools.json"
goto :generate

:config_custom
set "DOWNLOAD_URL=https://%AUTH_PREFIX%%REPO_BASE%/org/openapitools/openapi-generator-cli/${versionName}/openapi-generator-cli-${versionName}.jar"
rem Credentials may contain '&' or '<'. The value below is echoed inside double
rem quotes, so those characters stay literal and must NOT be escaped here.
set "DOWNLOAD_URL_FOR_JSON=%DOWNLOAD_URL%"
echo Generating openapitools.json with custom repository configuration...
(
  echo {
  echo   "$schema": "./node_modules/@openapitools/openapi-generator-cli/config.schema.json",
  echo   "spaces": 2,
  echo   "generator-cli": {
  echo     "version": "%OPENAPI_GENERATOR_VERSION%",
  echo     "repository": {
  echo       "downloadUrl": "%DOWNLOAD_URL_FOR_JSON%"
  echo     }
  echo   }
  echo }
) > "openapitools.json"
goto :generate

rem ---------------------------------------------------------------------
rem Generate the client
rem ---------------------------------------------------------------------
:generate
echo Generating Fluxnova client...
call npx openapi-generator-cli generate ^
  -i fluxnova-openapi.json ^
  -g typescript-axios ^
  -o "%OUTPUT_DIR%" ^
  --additional-properties=useSingleRequestParameter=true ^
  --parameter-name-mappings configuration=config

if errorlevel 1 goto :generate_failed

echo Successfully generated Fluxnova client in %OUTPUT_DIR%
popd
exit /b 0

:generate_failed
echo Failed to generate Fluxnova client
goto :fail

rem ---------------------------------------------------------------------
rem Error exits
rem ---------------------------------------------------------------------
:fail
popd
exit /b 1

:no_project_root
echo Unable to locate project root: %~dp0..
exit /b 1

:no_node
echo Node.js is required but "node" was not found in PATH.
popd
exit /b 1

:no_curl
echo curl is required but was not found in PATH.
popd
exit /b 1

rem ---------------------------------------------------------------------
rem Helpers
rem ---------------------------------------------------------------------
:get_version_from_package_json
set "NON_JS_DEPENDENCY_VERSION=%~1"
set "VERSION="
set "VERSION_FILE=%TEMP%\fluxnova-version-%RANDOM%%RANDOM%.txt"
node -p "require('./package.json').nonJsDependencies.%~1" > "%VERSION_FILE%" 2>nul
if errorlevel 1 goto :gv_missing
set /p VERSION=<"%VERSION_FILE%"
del /f /q "%VERSION_FILE%" >nul 2>&1
if not defined VERSION goto :gv_missing
if /i "%VERSION%"=="undefined" goto :gv_missing
exit /b 0

:gv_missing
echo %NON_JS_DEPENDENCY_VERSION% field is missing in package.json nonJsDependencies
if exist "%VERSION_FILE%" del /f /q "%VERSION_FILE%" >nul 2>&1
exit /b 1

:show_usage
echo Usage: %SCRIPT_NAME% [options]
echo Options:
echo   --fxn-artifact-repo REPO           Artifactory repository name
echo   --fxn-artifact-repo-user USERNAME  Artifactory username (required for auth)
echo   --fxn-artifact-repo-token TOKEN    Artifactory authentication token (preferred over password)
echo   --fxn-artifact-repo-pass PASSWORD  Artifactory password (used if no token provided)
echo   --fluxnova-version VERSION         Fluxnova version (default: %FLUXNOVA_VERSION%)
echo   --output-dir DIR                   Output directory (default: %OUTPUT_DIR%)
echo   -h, --help                         Show this help message
exit /b 0
