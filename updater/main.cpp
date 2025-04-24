#include <iostream>
#include <string>
#include <windows.h>
#include <wininet.h>
#include <shlobj.h>
#include <tlhelp32.h>
#include <vector>
#include <algorithm>

// Função para converter string para wstring
std::wstring StringToWide(const std::string& str) {
    int size_needed = MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), NULL, 0);
    std::wstring wstr(size_needed, 0);
    MultiByteToWideChar(CP_UTF8, 0, &str[0], (int)str.size(), &wstr[0], size_needed);
    return wstr;
}

// Estrutura para armazenar informações da versão
struct Version {
    int major;
    int minor;
    int patch;
    
    Version(const std::string& versionStr) {
        // Substitui sscanf_s por sscanf para compatibilidade com MinGW
        sscanf(versionStr.c_str(), "%d.%d.%d", &major, &minor, &patch);
    }
    
    bool operator>(const Version& other) const {
        // Implementação alternativa sem std::tie
        if (major != other.major) return major > other.major;
        if (minor != other.minor) return minor > other.minor;
        return patch > other.patch;
    }
};

// Funções auxiliares para manipulação de arquivos
bool FileExists(const std::wstring& path) {
    DWORD attrib = GetFileAttributesW(path.c_str());
    return (attrib != INVALID_FILE_ATTRIBUTES && !(attrib & FILE_ATTRIBUTE_DIRECTORY));
}

bool DeleteFile(const std::wstring& path) {
    return DeleteFileW(path.c_str());
}

bool MoveFile(const std::wstring& from, const std::wstring& to) {
    return MoveFileExW(from.c_str(), to.c_str(), MOVEFILE_REPLACE_EXISTING);
}

std::wstring GetExeDirectory() {
    wchar_t path[MAX_PATH];
    GetModuleFileNameW(NULL, path, MAX_PATH);
    std::wstring fullPath(path);
    return fullPath.substr(0, fullPath.find_last_of(L"\\/"));
}

// Função para baixar arquivos
bool DownloadFile(const std::string& url, const std::wstring& savePath) {
    HINTERNET hInternet = InternetOpenA("Updater", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) return false;

    HINTERNET hFile = InternetOpenUrlA(hInternet, url.c_str(), NULL, 0, INTERNET_FLAG_RELOAD, 0);
    if (!hFile) {
        InternetCloseHandle(hInternet);
        return false;
    }

    HANDLE hOutFile = CreateFileW(savePath.c_str(), GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (hOutFile == INVALID_HANDLE_VALUE) {
        InternetCloseHandle(hFile);
        InternetCloseHandle(hInternet);
        return false;
    }

    DWORD bytesRead;
    BYTE buffer[1024];
    bool success = true;

    while (InternetReadFile(hFile, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
        DWORD bytesWritten;
        if (!WriteFile(hOutFile, buffer, bytesRead, &bytesWritten, NULL)) {
            success = false;
            break;
        }
    }

    CloseHandle(hOutFile);
    InternetCloseHandle(hFile);
    InternetCloseHandle(hInternet);

    return success;
}

// Função para verificar se um processo está rodando
bool IsProcessRunning(const std::wstring& processName) {
    PROCESSENTRY32W entry;
    entry.dwSize = sizeof(PROCESSENTRY32W);

    // Corrigido: substituído NULL por 0 para compatibilidade
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (Process32FirstW(snapshot, &entry)) {
        while (Process32NextW(snapshot, &entry)) {
            if (_wcsicmp(entry.szExeFile, processName.c_str()) == 0) {
                CloseHandle(snapshot);
                return true;
            }
        }
    }
    
    CloseHandle(snapshot);
    return false;
}

// Função para matar um processo
void KillProcess(const std::wstring& processName) {
    PROCESSENTRY32W entry;
    entry.dwSize = sizeof(PROCESSENTRY32W);

    // Corrigido: substituído NULL por 0 para compatibilidade
    HANDLE snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (Process32FirstW(snapshot, &entry)) {
        while (Process32NextW(snapshot, &entry)) {
            if (_wcsicmp(entry.szExeFile, processName.c_str()) == 0) {
                HANDLE hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, entry.th32ProcessID);
                if (hProcess) {
                    TerminateProcess(hProcess, 0);
                    CloseHandle(hProcess);
                }
            }
        }
    }
    
    CloseHandle(snapshot);
}

// Função para obter a última versão do GitHub
std::string GetLatestVersion() {
    HINTERNET hInternet = InternetOpenA("Updater", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
    if (!hInternet) return "";

    HINTERNET hFile = InternetOpenUrlA(hInternet, "https://api.github.com/repos/tysaiwofc/win11-simulator/releases/latest", NULL, 0, INTERNET_FLAG_RELOAD, 0);
    if (!hFile) {
        InternetCloseHandle(hInternet);
        return "";
    }

    std::string response;
    DWORD bytesRead;
    BYTE buffer[1024];

    while (InternetReadFile(hFile, buffer, sizeof(buffer), &bytesRead) && bytesRead > 0) {
        response.append(reinterpret_cast<char*>(buffer), bytesRead);
    }

    InternetCloseHandle(hFile);
    InternetCloseHandle(hInternet);

    // Extrai a versão da resposta JSON
    size_t tagPos = response.find("\"tag_name\":");
    if (tagPos == std::string::npos) return "";

    size_t versionStart = response.find('"', tagPos + 11) + 1;
    size_t versionEnd = response.find('"', versionStart);
    
    return response.substr(versionStart, versionEnd - versionStart);
}

int main(int argc, char* argv[]) {
    // Verifica se foi passada a versão atual como argumento
    if (argc < 2) {
        std::cerr << "Uso: " << argv[0] << " <versao_atual>" << std::endl;
        return 1;
    }

    std::string currentVersionStr = argv[1];
    Version currentVersion(currentVersionStr);

    // Obtém a última versão
    std::string latestTag = GetLatestVersion();
    if (latestTag.empty()) {
        std::cerr << "Erro ao obter a ultima versao" << std::endl;
        return 1;
    }

    // Remove o 'v' do início se existir
    if (latestTag[0] == 'v') {
        latestTag = latestTag.substr(1);
    }

    Version latestVersion(latestTag);

    // Verifica se precisa atualizar
    if (latestVersion > currentVersion) {
        std::cout << "Nova versao disponivel: " << latestTag << std::endl;
        
        // Caminhos dos arquivos
        std::wstring exeDir = GetExeDirectory();
        std::wstring newExePath = exeDir + L"\\Windows.11.Simulator." + StringToWide(latestTag) + L".exe";
        std::wstring targetExePath = exeDir + L"\\Windows.11.Simulator.exe";
        
        // URL de download
        std::string downloadUrl = "https://github.com/tysaiwofc/win11-simulator/releases/download/v" + 
                                latestTag + "/Windows.11.Simulator." + latestTag + ".exe";

        // Baixa a nova versão
        std::cout << "Baixando nova versao..." << std::endl;
        
        if (!DownloadFile(downloadUrl, newExePath)) {
            std::cerr << "Erro ao baixar a nova versao" << std::endl;
            return 1;
        }

        // Fecha o aplicativo se estiver rodando
        if (IsProcessRunning(L"Windows.11.Simulator.exe")) {
            std::cout << "Fechando aplicativo em execucao..." << std::endl;
            KillProcess(L"Windows.11.Simulator.exe");
            Sleep(2000); // Espera 2 segundos
        }

        // Substitui o arquivo antigo
        if (FileExists(targetExePath)) {
            if (!DeleteFile(targetExePath)) {
                std::cerr << "Erro ao remover arquivo antigo" << std::endl;
                return 1;
            }
        }
        
        if (!MoveFile(newExePath, targetExePath)) {
            std::cerr << "Erro ao instalar a atualizacao" << std::endl;
            return 1;
        }
        
        std::cout << "Atualizacao concluida com sucesso!" << std::endl;
        
        // Inicia o novo aplicativo
        ShellExecuteW(NULL, L"open", targetExePath.c_str(), NULL, NULL, SW_SHOWNORMAL);
    } else {
        std::cout << "Ja esta na versao mais recente (" << latestTag << ")" << std::endl;
    }

    return 0;
}