const API_BASE_URL = "https://fesp-api.koyeb.app/market";
const STORAGE_KEYS = {
  theme: "brunch.login.theme",
  rememberFlag: "brunch.login.remember",
  rememberEmail: "brunch.login.email",
  token: "brunch.login.token",
} as const;

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  ok: boolean;
  message?: string;
  token?: string;
}

interface MemberResponse {
  ok: boolean;
  message?: string;
  items?: {
    id: string;
    email: string;
    name: string;
  };
}

const rootElement = document.body;
const form = document.querySelector<HTMLFormElement>("#loginForm");
const emailInput = document.querySelector<HTMLInputElement>("#emailInput");
const passwordInput = document.querySelector<HTMLInputElement>("#passwordInput");
const statusElement = document.querySelector<HTMLDivElement>(".login__status");
const submitButton = document.querySelector<HTMLButtonElement>(".login__submit");
const rememberButton = document.querySelector<HTMLButtonElement>("[data-role='remember']");
const passwordToggle = document.querySelector<HTMLButtonElement>("[data-toggle='passwordInput']");
const fields = {
  email: document.querySelector<HTMLDivElement>("[data-field='email']"),
  password: document.querySelector<HTMLDivElement>("[data-field='password']"),
};
const themeButtons = document.querySelectorAll<HTMLButtonElement>(".theme-switcher__button");

function safelyUseLocalStorage<T>(fallback: T, task: () => T): T {
  try {
    return task();
  } catch (error) {
    console.warn("로컬 스토리지 사용이 제한되었습니다.", error);
    return fallback;
  }
}

function applyTheme(theme: string): void {
  const themes = ["theme-brunch", "theme-kakao", "theme-social"];
  themes.forEach((name) => rootElement.classList.remove(name));
  rootElement.classList.add(theme);

  themeButtons.forEach((button) => {
    const isActive = button.dataset.theme === theme;
    button.classList.toggle("is-active", isActive);
  });

  safelyUseLocalStorage(false, () => {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
    return false;
  });
}

function restoreTheme(): void {
  const savedTheme = safelyUseLocalStorage<string | null>(null, () =>
    localStorage.getItem(STORAGE_KEYS.theme)
  );
  applyTheme(savedTheme ?? "theme-brunch");
}

function setRememberState(active: boolean): void {
  rememberButton?.classList.toggle("is-active", active);
  rememberButton?.setAttribute("aria-pressed", String(active));
  safelyUseLocalStorage(false, () => {
    localStorage.setItem(STORAGE_KEYS.rememberFlag, JSON.stringify(active));
    if (!active) {
      localStorage.removeItem(STORAGE_KEYS.rememberEmail);
    }
    return false;
  });
}

function restoreRememberState(): void {
  const rememberFlag = safelyUseLocalStorage(false, () => {
    const raw = localStorage.getItem(STORAGE_KEYS.rememberFlag);
    return raw ? (JSON.parse(raw) as boolean) : false;
  });

  setRememberState(rememberFlag);

  if (rememberFlag && emailInput) {
    const savedEmail = safelyUseLocalStorage<string | null>(null, () =>
      localStorage.getItem(STORAGE_KEYS.rememberEmail)
    );
    if (savedEmail) {
      emailInput.value = savedEmail;
    }
  }
}

function updateRememberEmail(): void {
  const active = rememberButton?.classList.contains("is-active") ?? false;
  if (!active || !emailInput) {
    return;
  }

  safelyUseLocalStorage(false, () => {
    localStorage.setItem(STORAGE_KEYS.rememberEmail, emailInput.value.trim());
    return false;
  });
}

function setFieldState(
  field: keyof typeof fields,
  type: "success" | "error" | "neutral",
  message?: string
): void {
  const fieldElement = fields[field];
  if (!fieldElement) {
    return;
  }

  fieldElement.classList.remove("field--success", "field--error");
  if (type !== "neutral") {
    fieldElement.classList.add(type === "success" ? "field--success" : "field--error");
  }

  const messageElement = fieldElement.querySelector<HTMLParagraphElement>(".field__message");
  if (messageElement) {
    messageElement.textContent = message ?? "";
  }
}

function setStatus(message: string, type: "success" | "error" | "info" = "info"): void {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;
  statusElement.classList.remove("is-success", "is-error");
  if (type === "success") {
    statusElement.classList.add("is-success");
  }
  if (type === "error") {
    statusElement.classList.add("is-error");
  }
}

function updateSubmitState(): void {
  if (!submitButton || !emailInput || !passwordInput) {
    return;
  }

  const emailValid = emailInput.value.trim().length > 0 && emailInput.checkValidity();
  const passwordValid = passwordInput.value.trim().length >= 6;
  const isActive = emailValid && passwordValid;

  submitButton.disabled = false;
  submitButton.classList.toggle("is-active", isActive);
}

function validateEmail(): boolean {
  if (!emailInput) {
    return false;
  }

  const value = emailInput.value.trim();
  if (value.length === 0) {
    setFieldState("email", "error", "이메일을 입력해주세요.");
    return false;
  }

  if (!emailInput.checkValidity()) {
    setFieldState("email", "error", "올바른 이메일 형식이 아니에요.");
    return false;
  }

  setFieldState("email", "success", "좋아요!");
  return true;
}

function validatePassword(): boolean {
  if (!passwordInput) {
    return false;
  }

  const value = passwordInput.value.trim();
  if (value.length < 6) {
    setFieldState("password", "error", "비밀번호는 6자 이상이어야 해요.");
    return false;
  }

  setFieldState("password", "success", "안전한 비밀번호네요.");
  return true;
}

async function loginMember(request: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/member/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    const data = (await response.json()) as LoginResponse;
    if (!response.ok) {
      return {
        ok: false,
        message: data.message ?? "로그인에 실패했습니다.",
      };
    }

    return data;
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "서버와 통신할 수 없습니다.",
    };
  }
}

async function fetchMemberInfo(token: string): Promise<MemberResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/member/info`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = (await response.json()) as MemberResponse;
    if (!response.ok) {
      return {
        ok: false,
        message: data.message ?? "회원정보를 불러오지 못했습니다.",
      };
    }

    return data;
  } catch (error) {
    console.error(error);
    return {
      ok: false,
      message: "회원정보를 불러올 수 없습니다.",
    };
  }
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!form || !emailInput || !passwordInput || !submitButton) {
    return;
  }

  const emailValid = validateEmail();
  const passwordValid = validatePassword();
  if (!emailValid) {
    emailInput.focus();
    return;
  }
  if (!passwordValid) {
    passwordInput.focus();
    return;
  }

  const rememberActive = rememberButton?.classList.contains("is-active") ?? false;

  submitButton.disabled = true;
  submitButton.classList.remove("is-active");
  submitButton.textContent = "로그인 중...";
  setStatus("로그인 중입니다...", "info");

  const loginResult = await loginMember({
    email: emailInput.value.trim(),
    password: passwordInput.value,
  });

  if (!loginResult.ok || !loginResult.token) {
    submitButton.disabled = false;
    submitButton.textContent = "로그인";
    updateSubmitState();
    setStatus(loginResult.message ?? "로그인에 실패했습니다.", "error");
    setFieldState("password", "error", "다시 한번 확인해주세요.");
    return;
  }

  setStatus("로그인에 성공했어요!", "success");
  safelyUseLocalStorage(false, () => {
    localStorage.setItem(STORAGE_KEYS.token, loginResult.token as string);
    if (rememberActive) {
      localStorage.setItem(STORAGE_KEYS.rememberEmail, emailInput.value.trim());
    }
    return false;
  });

  if (!rememberActive) {
    safelyUseLocalStorage(false, () => {
      localStorage.removeItem(STORAGE_KEYS.rememberEmail);
      return false;
    });
  }

  const info = await fetchMemberInfo(loginResult.token);
  if (info.ok && info.items) {
    console.info("회원 정보", info.items);
  }

  form.reset();
  setFieldState("email", "neutral");
  setFieldState("password", "neutral");
  if (rememberActive && emailInput) {
    emailInput.value = safelyUseLocalStorage<string | null>(null, () =>
      localStorage.getItem(STORAGE_KEYS.rememberEmail)
    ) ?? "";
  }

  updateSubmitState();
  submitButton.disabled = false;
  submitButton.textContent = "로그인";
  if (rememberActive && passwordInput) {
    passwordInput.focus();
  }
}

function handleRememberToggle(): void {
  const active = rememberButton?.classList.contains("is-active") ?? false;
  setRememberState(!active);
  if (!active) {
    updateRememberEmail();
  }
}

function handlePasswordToggle(): void {
  if (!passwordInput || !passwordToggle) {
    return;
  }

  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";
  passwordToggle.textContent = isPassword ? "숨기기" : "보기";
  passwordToggle.setAttribute("aria-label", isPassword ? "비밀번호 숨기기" : "비밀번호 보기");
  passwordInput.focus();
}

function initEventHandlers(): void {
  themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.theme;
      if (theme) {
        applyTheme(theme);
      }
    });
  });

  rememberButton?.addEventListener("click", () => {
    handleRememberToggle();
  });

  passwordToggle?.addEventListener("click", () => {
    handlePasswordToggle();
  });

  emailInput?.addEventListener("input", () => {
    validateEmail();
    updateSubmitState();
    updateRememberEmail();
  });

  passwordInput?.addEventListener("input", () => {
    validatePassword();
    updateSubmitState();
  });

  form?.addEventListener("submit", (event) => {
    void handleSubmit(event);
  });
}

function init(): void {
  restoreTheme();
  restoreRememberState();
  updateSubmitState();
  initEventHandlers();
}

init();
