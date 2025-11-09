import { registerUser, getUserList, ApiItemResponse, User } from "../api";

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

/**
 * 닉네임 필드 값 자체의 유효성 검사 (길이 등)를 수행합니다.
 * 필드 상태 업데이트(메시지 표시)는 ignoreStateUpdate가 false일 때만 수행합니다.
 * @param ignoreStateUpdate 필드 상태(색상, 메시지) 업데이트를 무시할지 여부
 * @returns 유효성 여부
 */
function checkNicknameValueValidity(ignoreStateUpdate = false): boolean {
  if (!nicknameInput) {
    return false;
  }
  const value = nicknameInput.value.trim();
  
  if (value.length < 2) {
    if (!ignoreStateUpdate) {
      setFieldState("nickname", "error", "별명은 2자 이상 입력해주세요.");
    }
    return false;
  }
  if (value.length > 20) {
    if (!ignoreStateUpdate) {
      setFieldState("nickname", "error", "20자 이하로 입력해주세요.");
    }
    return false;
  }
  
  // 값 자체는 유효하지만, 아직 중복 확인을 하지 않은 경우
  if (!ignoreStateUpdate && !duplicateState.nicknameChecked) {
    setFieldState("nickname", "info", "중복확인을 진행해주세요.");
  } else if (!ignoreStateUpdate && duplicateState.nicknameChecked) {
    // 값 자체도 유효하고 중복 확인도 완료된 경우
    setFieldState("nickname", "success", "사용할 수 있는 별명입니다.");
  } else if (!ignoreStateUpdate) {
    // 값은 유효하나 중복 확인 상태는 'neutral'로 남겨둡니다. (input 이벤트 리스너에서 'neutral'로 설정하는 것이 더 명확함)
    setFieldState("nickname", "neutral", "");
  }

  return true;
}

/**
 * 최종 닉네임 유효성 검사. (값 유효성 + 중복확인 완료 여부)
 */
function validateNickname(): boolean {
    const valueValid = checkNicknameValueValidity(true); // 값 유효성만 체크 (상태 업데이트 없음)
    
    // 최종 제출 시에만 이 로직이 실행되어야 함.
    if (!valueValid) {
        // 이 함수를 호출한 곳에서 필드 상태 업데이트를 대신 수행할 수 있도록 함.
        checkNicknameValueValidity(false); 
        duplicateState.nicknameChecked = false; // 값이 유효하지 않으면 중복 확인 상태 초기화
        return false;
    }
    
    if (!duplicateState.nicknameChecked) {
        setFieldState("nickname", "info", "중복확인을 진행해주세요.");
        return false;
    }
    
    setFieldState("nickname", "success", "사용할 수 있는 별명입니다.");
    return true;
}

/**
 * 이메일 필드 값 자체의 유효성 검사 (형식 등)를 수행합니다.
 * 필드 상태 업데이트(메시지 표시)는 ignoreStateUpdate가 false일 때만 수행합니다.
 * @param ignoreStateUpdate 필드 상태(색상, 메시지) 업데이트를 무시할지 여부
 * @returns 유효성 여부
 */
function checkEmailValueValidity(ignoreStateUpdate = false): boolean {
  if (!emailInput) {
    return false;
  }
  const value = emailInput.value.trim();

  if (value.length === 0) {
    if (!ignoreStateUpdate) {
      setFieldState("email", "error", "이메일을 입력해주세요.");
    }
    return false;
  }
  if (!emailInput.checkValidity()) {
    if (!ignoreStateUpdate) {
      setFieldState("email", "error", "올바른 이메일 형식이 아니에요.");
    }
    return false;
  }

  // 값 자체는 유효하지만, 아직 중복 확인을 하지 않은 경우
  if (!ignoreStateUpdate && !duplicateState.emailChecked) {
    setFieldState("email", "info", "중복확인을 진행해주세요.");
  } else if (!ignoreStateUpdate && duplicateState.emailChecked) {
    // 값 자체도 유효하고 중복 확인도 완료된 경우
    setFieldState("email", "success", "사용할 수 있는 이메일입니다.");
  } else if (!ignoreStateUpdate) {
    // 값은 유효하나 중복 확인 상태는 'neutral'로 남겨둡니다.
    setFieldState("email", "neutral", "");
  }

  return true;
}

/**
 * 최종 이메일 유효성 검사. (값 유효성 + 중복확인 완료 여부)
 */
function validateEmail(): boolean {
    const valueValid = checkEmailValueValidity(true); // 값 유효성만 체크 (상태 업데이트 없음)
    
    if (!valueValid) {
        checkEmailValueValidity(false);
        duplicateState.emailChecked = false;
        return false;
    }
    
    if (!duplicateState.emailChecked) {
        setFieldState("email", "info", "중복확인을 진행해주세요.");
        return false;
    }
    
    setFieldState("email", "success", "사용할 수 있는 이메일입니다.");
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

/**
 * 제출 가능 상태를 업데이트합니다. (필드 상태 업데이트는 하지 않고 유효성 여부만 판단)
 */
function updateSubmitState(): void {
  if (!submitButton) {
    return;
  }

  const nicknameValueValid = checkNicknameValueValidity(true); // 값 유효성만 확인
  const emailValueValid = checkEmailValueValidity(true); // 값 유효성만 확인
  const passwordValueValid = validatePassword(); // 값 유효성 확인 + 상태 업데이트
  const confirmValueValid = validatePasswordConfirm(); // 값 유효성 확인 + 상태 업데이트
  
  // 비밀번호와 비밀번호 확인은 값 변경 시 필드 상태를 바로 업데이트하기 때문에 validate 함수를 그대로 사용해도 무방합니다.

  const canSubmit =
    nicknameValueValid &&
    emailValueValid &&
    passwordValueValid &&
    confirmValueValid &&
    duplicateState.nicknameChecked &&
    duplicateState.emailChecked;

  submitButton.disabled = !canSubmit; // canSubmit이 false면 disabled를 true로
  submitButton.classList.toggle("is-active", canSubmit);
}

/**
 * 중복확인 버튼 클릭 핸들러 (회원 목록 API를 참조해 중복 여부를 확인)
 */
async function handleDuplicateCheck(type: "nickname" | "email"): Promise<void> {
  const isNickname = type === "nickname";
  const input = isNickname ? nicknameInput : emailInput;
  const button = isNickname ? nicknameCheckButton : emailCheckButton;
  const valid = isNickname ? checkNicknameValueValidity(true) : checkEmailValueValidity(true);

  if (!input || !valid) {
    if (isNickname) {
      checkNicknameValueValidity(false);
      duplicateState.nicknameChecked = false;
    } else {
      checkEmailValueValidity(false);
      duplicateState.emailChecked = false;
    }
    updateSubmitState();
    return;
  }

  const value = input.value.trim();
  button?.setAttribute("disabled", "true");
  button?.classList.remove("is-active");
  setFormStatus(`${isNickname ? "별명" : "이메일"} 중복을 확인하고 있어요...`, "info");

  try {
    const response = await getUserList();
    if (!response.ok) {
      throw new Error(response.message ?? "회원 목록을 불러오지 못했습니다.");
    }

    const list = (response.items ?? response.data ?? []) as User[];
    const exists = list.some((user) => {
      if (!user) {
        return false;
      }
      return isNickname ? user.name === value : user.email === value;
    });

    if (exists) {
      if (isNickname) {
        duplicateState.nicknameChecked = false;
        setFieldState("nickname", "error", "이미 사용 중인 별명입니다.");
      } else {
        duplicateState.emailChecked = false;
        setFieldState("email", "error", "이미 사용 중인 이메일입니다.");
      }
      setFormStatus(`이미 사용 중인 ${isNickname ? "별명" : "이메일"}이에요.`, "error");
    } else {
      if (isNickname) {
        duplicateState.nicknameChecked = true;
        setFieldState("nickname", "success", "사용할 수 있는 별명입니다.");
      } else {
        duplicateState.emailChecked = true;
        setFieldState("email", "success", "사용할 수 있는 이메일입니다.");
      }
      setFormStatus(`사용 가능한 ${isNickname ? "별명" : "이메일"}이에요!`, "success");
    }
  } catch (error) {
    console.error(error);
    if (isNickname) {
      duplicateState.nicknameChecked = false;
      setFieldState("nickname", "error", "중복 확인을 다시 시도해주세요.");
    } else {
      duplicateState.emailChecked = false;
      setFieldState("email", "error", "중복 확인을 다시 시도해주세요.");
    }
    setFormStatus("중복 확인에 실패했습니다. 잠시 후 다시 시도해주세요.", "error");
  } finally {
    button?.removeAttribute("disabled");
    button?.classList.add("is-active");
    updateSubmitState();
  }
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
  
  // 최종 제출 시에는 validateNickname, validateEmail을 호출하여 중복확인 상태까지 모두 검사하고 필드 상태를 업데이트합니다.
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

  let response: ApiItemResponse<User>;
  try {
    response = await registerUser({
      email: emailInput.value.trim(),
      password: passwordInput.value,
      name: nicknameInput.value.trim(),
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
    // updateSubmitState() 대신 수동으로 상태 업데이트
    const canSubmit = 
        checkNicknameValueValidity(true) &&
        checkEmailValueValidity(true) &&
        validatePassword() &&
        validatePasswordConfirm() &&
        duplicateState.nicknameChecked &&
        duplicateState.emailChecked;

    submitButton.classList.toggle("is-active", canSubmit);
    setFormStatus(response.message ?? "회원가입에 실패했습니다.", "error");
    
    // 서버 응답에서 중복 오류가 발생한 경우 해당 필드의 상태를 업데이트합니다.
    if (response.message?.includes("이메일")) {
      duplicateState.emailChecked = false;
      setFieldState("email", "error", response.message);
    } else if (response.message?.includes("별명") || response.message?.includes("닉네임")) {
      duplicateState.nicknameChecked = false;
      setFieldState("nickname", "error", response.message);
    }
    return;
  }

  setFormStatus("회원가입이 완료되었습니다!", "success");
  form.reset();
  duplicateState.nicknameChecked = false;
  duplicateState.emailChecked = false;
  // 모든 필드 상태 초기화
  Object.keys(fieldElements).forEach((key) => {
    setFieldState(key as FieldKey, "neutral", "");
  });
  updateSubmitState(); // 초기 상태로 버튼 업데이트
}

function init(): void {
  // 닉네임 입력 시
  nicknameInput?.addEventListener("input", () => {
    duplicateState.nicknameChecked = false; // 입력이 변경되면 중복확인 상태 초기화
    checkNicknameValueValidity(false); // 값 유효성 검사 및 필드 상태 업데이트
    updateSubmitState();
  });
  
  // 이메일 입력 시
  emailInput?.addEventListener("input", () => {
    duplicateState.emailChecked = false; // 입력이 변경되면 중복확인 상태 초기화
    checkEmailValueValidity(false); // 값 유효성 검사 및 필드 상태 업데이트
    updateSubmitState();
  });
  
  // 비밀번호 입력 시 (상태 바로 업데이트)
  passwordInput?.addEventListener("input", () => {
    validatePassword();
    validatePasswordConfirm(); // 비밀번호가 바뀌면 비밀번호 확인도 다시 검사
    updateSubmitState();
  });
  
  // 비밀번호 확인 입력 시 (상태 바로 업데이트)
  passwordConfirmInput?.addEventListener("input", () => {
    validatePasswordConfirm();
    updateSubmitState();
  });

  nicknameCheckButton?.addEventListener("click", () => {
    void handleDuplicateCheck("nickname");
  });
  emailCheckButton?.addEventListener("click", () => {
    void handleDuplicateCheck("email");
  });

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