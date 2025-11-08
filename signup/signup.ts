import { registerMember, MemberRes } from "../api";

const form = document.querySelector<HTMLFormElement>("#signupForm");
const nicknameInput = document.querySelector<HTMLInputElement>("#nicknameInput");
const emailInput = document.querySelector<HTMLInputElement>("#emailInput");
const passwordInput = document.querySelector<HTMLInputElement>("#passwordInput");
const passwordConfirmInput = document.querySelector<HTMLInputElement>("#passwordConfirmInput");
const submitButton = document.querySelector<HTMLButtonElement>(".signup__submit");
const formStatus = document.querySelector<HTMLDivElement>(".form-status");
const nicknameCheckButton = document.querySelector<HTMLButtonElement>("[data-action='nickname-check']");
const emailCheckButton = document.querySelector<HTMLButtonElement>("[data-action='email-check']");
const passwordToggle = document.querySelector<HTMLButtonElement>("[data-toggle='password']");
const passwordConfirmToggle = document.querySelector<HTMLButtonElement>("[data-toggle='password-confirm']");

const fieldElements = {
  nickname: document.querySelector<HTMLDivElement>("[data-field='nickname']"),
  email: document.querySelector<HTMLDivElement>("[data-field='email']"),
  password: document.querySelector<HTMLDivElement>("[data-field='password']"),
  passwordConfirm: document.querySelector<HTMLDivElement>("[data-field='passwordConfirm']"),
} as const;

type FieldKey = keyof typeof fieldElements;

type FieldState = "neutral" | "success" | "error" | "info";

const duplicateState = {
  nicknameChecked: false,
  emailChecked: false,
};

function setFieldState(field: FieldKey, state: FieldState, message?: string): void {
  const fieldElement = fieldElements[field];
  if (!fieldElement) {
    return;
  }

  fieldElement.classList.remove("field--success", "field--error", "field--info");
  if (state !== "neutral") {
    const className = state === "success" ? "field--success" : state === "error" ? "field--error" : "field--info";
    fieldElement.classList.add(className);
  }

  const messageElement = fieldElement.querySelector<HTMLParagraphElement>(".field__message");
  if (messageElement) {
    messageElement.textContent = message ?? "";
  }
}

function setFormStatus(message: string, type: "success" | "error" | "info" = "info"): void {
  if (!formStatus) {
    return;
  }

  formStatus.textContent = message;
  formStatus.classList.remove("is-success", "is-error");
  if (type === "success") {
    formStatus.classList.add("is-success");
  }
  if (type === "error") {
    formStatus.classList.add("is-error");
  }
}

function validateNickname(ignoreDuplicate = false): boolean {
  if (!nicknameInput) {
    return false;
  }
  const value = nicknameInput.value.trim();
  if (value.length < 2) {
    setFieldState("nickname", "error", "별명은 2자 이상 입력해주세요.");
    duplicateState.nicknameChecked = false;
    return false;
  }
  if (value.length > 20) {
    setFieldState("nickname", "error", "20자 이하로 입력해주세요.");
    duplicateState.nicknameChecked = false;
    return false;
  }
  if (!ignoreDuplicate && !duplicateState.nicknameChecked) {
    setFieldState("nickname", "info", "중복확인을 진행해주세요.");
    return false;
  }
  if (duplicateState.nicknameChecked) {
    setFieldState("nickname", "success", "사용할 수 있는 별명입니다.");
  }
  return true;
}

function validateEmail(ignoreDuplicate = false): boolean {
  if (!emailInput) {
    return false;
  }
  const value = emailInput.value.trim();
  if (value.length === 0) {
    setFieldState("email", "error", "이메일을 입력해주세요.");
    duplicateState.emailChecked = false;
    return false;
  }
  if (!emailInput.checkValidity()) {
    setFieldState("email", "error", "올바른 이메일 형식이 아니에요.");
    duplicateState.emailChecked = false;
    return false;
  }
  if (!ignoreDuplicate && !duplicateState.emailChecked) {
    setFieldState("email", "info", "중복확인을 진행해주세요.");
    return false;
  }
  if (duplicateState.emailChecked) {
    setFieldState("email", "success", "사용할 수 있는 이메일입니다.");
  }
  return true;
}

function validatePassword(): boolean {
  if (!passwordInput) {
    return false;
  }
  const value = passwordInput.value;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  if (value.length < 8 || !hasLetter || !hasNumber) {
    setFieldState("password", "error", "대소문자, 숫자 조합 8자 이상이어야 합니다.");
    return false;
  }
  setFieldState("password", "success", "좋은 비밀번호네요.");
  return true;
}

function validatePasswordConfirm(): boolean {
  if (!passwordInput || !passwordConfirmInput) {
    return false;
  }
  if (passwordConfirmInput.value.length === 0) {
    setFieldState("passwordConfirm", "error", "비밀번호를 한 번 더 입력해주세요.");
    return false;
  }
  if (passwordInput.value !== passwordConfirmInput.value) {
    setFieldState("passwordConfirm", "error", "비밀번호가 일치하지 않습니다.");
    return false;
  }
  setFieldState("passwordConfirm", "success", "비밀번호가 일치합니다.");
  return true;
}

function updateSubmitState(): void {
  if (!submitButton) {
    return;
  }

  const canSubmit =
    validateNickname(true) &&
    validateEmail(true) &&
    validatePassword() &&
    validatePasswordConfirm() &&
    duplicateState.nicknameChecked &&
    duplicateState.emailChecked;

  submitButton.disabled = !canSubmit;
  submitButton.classList.toggle("is-active", canSubmit);
}

function handleDuplicateCheck(type: "nickname" | "email"): void {
  if (type === "nickname") {
    const valid = validateNickname(true);
    if (valid) {
      duplicateState.nicknameChecked = true;
      setFieldState("nickname", "success", "사용할 수 있는 별명입니다.");
    }
  } else {
    const valid = validateEmail(true);
    if (valid) {
      duplicateState.emailChecked = true;
      setFieldState("email", "success", "사용할 수 있는 이메일입니다.");
    }
  }
  updateSubmitState();
}

function togglePasswordVisibility(input: HTMLInputElement | null, button: HTMLButtonElement | null): void {
  if (!input || !button) {
    return;
  }

  const isHidden = input.type === "password";
  input.type = isHidden ? "text" : "password";
  button.classList.toggle("is-visible", !isHidden);
  button.setAttribute("aria-label", isHidden ? "비밀번호 숨기기" : "비밀번호 보기");
}

async function handleSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();
  if (!form || !nicknameInput || !emailInput || !passwordInput || !submitButton) {
    return;
  }

  const nicknameValid = validateNickname();
  const emailValid = validateEmail();
  const passwordValid = validatePassword();
  const confirmValid = validatePasswordConfirm();

  if (!(nicknameValid && emailValid && passwordValid && confirmValid)) {
    setFormStatus("입력값을 확인해주세요.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.remove("is-active");
  setFormStatus("회원가입을 진행하고 있어요...", "info");

  let response: MemberRes;
  try {
    response = await registerMember({
      id: emailInput.value.trim(),
      pw: passwordInput.value,
      name: nicknameInput.value.trim(),
      email: emailInput.value.trim(),
    });
  } catch (error) {
    console.error(error);
    response = {
      ok: false,
      message: "서버와 통신할 수 없습니다.",
    };
  }

  if (!response.ok) {
    submitButton.disabled = false;
    updateSubmitState();
    setFormStatus(response.message ?? "회원가입에 실패했습니다.", "error");
    if (response.message?.includes("이메일")) {
      duplicateState.emailChecked = false;
      setFieldState("email", "error", response.message);
    }
    return;
  }

  setFormStatus("회원가입이 완료되었습니다!", "success");
  form.reset();
  duplicateState.nicknameChecked = false;
  duplicateState.emailChecked = false;
  Object.keys(fieldElements).forEach((key) => {
    setFieldState(key as FieldKey, "neutral", "");
  });
  updateSubmitState();
}

function init(): void {
  nicknameInput?.addEventListener("input", () => {
    duplicateState.nicknameChecked = false;
    validateNickname(true);
    updateSubmitState();
  });
  emailInput?.addEventListener("input", () => {
    duplicateState.emailChecked = false;
    validateEmail(true);
    updateSubmitState();
  });
  passwordInput?.addEventListener("input", () => {
    validatePassword();
    validatePasswordConfirm();
    updateSubmitState();
  });
  passwordConfirmInput?.addEventListener("input", () => {
    validatePasswordConfirm();
    updateSubmitState();
  });

  nicknameCheckButton?.addEventListener("click", () => handleDuplicateCheck("nickname"));
  emailCheckButton?.addEventListener("click", () => handleDuplicateCheck("email"));

  passwordToggle?.addEventListener("click", () => togglePasswordVisibility(passwordInput, passwordToggle));
  passwordConfirmToggle?.addEventListener("click", () =>
    togglePasswordVisibility(passwordConfirmInput, passwordConfirmToggle)
  );

  form?.addEventListener("submit", (event) => {
    void handleSubmit(event);
  });

  updateSubmitState();
}

init();
