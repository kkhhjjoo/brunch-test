import {
  getUserList,
  getUserById,
  updateUser,
  deleteUser,
  ApiListResponse,
  ApiItemResponse,
  User,
} from "../api";

const memberRows = document.querySelector<HTMLTableSectionElement>("[data-role='member-rows']");
const memberCount = document.querySelector<HTMLParagraphElement>("[data-role='member-count']");
const searchInput = document.querySelector<HTMLInputElement>("#memberSearch");
const refreshButton = document.querySelector<HTMLButtonElement>("[data-role='refresh']");
const placeholder = document.querySelector<HTMLParagraphElement>("[data-role='detail-placeholder']");
const memberForm = document.querySelector<HTMLFormElement>("[data-role='member-form']");
const deleteButton = document.querySelector<HTMLButtonElement>("[data-role='delete']");
const formStatus = document.querySelector<HTMLParagraphElement>("[data-role='form-status']");

const fieldElements: Record<keyof Pick<User, "_id" | "name" | "email" | "createdAt" | "updatedAt">, HTMLInputElement | null> = {
  _id: memberForm?.querySelector<HTMLInputElement>("[data-field='_id']") ?? null,
  name: memberForm?.querySelector<HTMLInputElement>("[data-field='name']") ?? null,
  email: memberForm?.querySelector<HTMLInputElement>("[data-field='email']") ?? null,
  createdAt: memberForm?.querySelector<HTMLInputElement>("[data-field='createdAt']") ?? null,
  updatedAt: memberForm?.querySelector<HTMLInputElement>("[data-field='updatedAt']") ?? null,
};

const fieldMessages: Record<keyof Pick<User, "name" | "email">, HTMLSpanElement | null> = {
  name: memberForm?.querySelector<HTMLSpanElement>("[data-field-message='name']") ?? null,
  email: memberForm?.querySelector<HTMLSpanElement>("[data-field-message='email']") ?? null,
};

let members: User[] = [];
let filteredMembers: User[] = [];
let selectedId: string | null = null;

function parseMembers(data: ApiListResponse<User> | User[]): User[] {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data.items)) {
    return data.items;
  }
  if (Array.isArray(data.data)) {
    return data.data as User[];
  }
  return [];
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "-";
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  } catch (error) {
    console.warn("날짜 형식을 변환할 수 없습니다.", error);
    return value;
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

function setFieldMessage(field: "name" | "email", message: string): void {
  const target = fieldMessages[field];
  if (target) {
    target.textContent = message;
  }
}

function clearFieldMessages(): void {
  setFieldMessage("name", "");
  setFieldMessage("email", "");
}

function renderMemberList(): void {
  if (!memberRows) {
    return;
  }

  memberRows.innerHTML = "";

  if (filteredMembers.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.className = "member-table__empty";
    emptyRow.innerHTML = '<td colspan="4">조건에 맞는 회원이 없습니다.</td>';
    memberRows.append(emptyRow);
    memberCount && (memberCount.textContent = "0명");
    return;
  }

  filteredMembers.forEach((member) => {
    const row = document.createElement("tr");
    row.dataset.memberId = member._id ?? "";
    if (member._id === selectedId) {
      row.classList.add("is-selected");
    }

    row.innerHTML = `
      <td>${member.name ?? "-"}</td>
      <td>${member.email ?? "-"}</td>
      <td>${formatDateTime(member.createdAt)}</td>
      <td>${member.provider ?? "일반"}</td>
    `;

    row.addEventListener("click", () => {
      if (member._id) {
        void showMemberDetail(member._id);
      }
    });

    memberRows.append(row);
  });

  memberCount && (memberCount.textContent = `${filteredMembers.length}명`);
}

function applySearch(keyword: string): void {
  const value = keyword.trim().toLowerCase();
  if (value.length === 0) {
    filteredMembers = [...members];
    return;
  }

  filteredMembers = members.filter((member) => {
    const name = member.name?.toLowerCase() ?? "";
    const email = member.email?.toLowerCase() ?? "";
    return name.includes(value) || email.includes(value);
  });
}

async function loadMembers(): Promise<void> {
  if (memberRows) {
    memberRows.innerHTML = `
      <tr class="member-table__empty">
        <td colspan="4">회원 정보를 불러오는 중입니다...</td>
      </tr>
    `;
  }

  try {
    const data = await getUserList();
    members = parseMembers(data);
    filteredMembers = [...members];
  } catch (error) {
    console.error(error);
    members = [];
    filteredMembers = [];
    if (memberRows) {
      memberRows.innerHTML = `
        <tr class="member-table__empty">
          <td colspan="4">회원 목록을 불러오지 못했습니다.</td>
        </tr>
      `;
    }
    memberCount && (memberCount.textContent = "0명");
    return;
  }

  renderMemberList();
}

function populateForm(member: User): void {
  if (!memberForm) {
    return;
  }

  placeholder?.setAttribute("hidden", "");
  memberForm.hidden = false;

  fieldElements._id && (fieldElements._id.value = member._id ?? "");
  fieldElements.name && (fieldElements.name.value = member.name ?? "");
  fieldElements.email && (fieldElements.email.value = member.email ?? "");
  fieldElements.createdAt && (fieldElements.createdAt.value = formatDateTime(member.createdAt));
  fieldElements.updatedAt && (fieldElements.updatedAt.value = formatDateTime(member.updatedAt));

  clearFieldMessages();
  setFormStatus("회원 정보를 불러왔습니다.", "info");
}

async function showMemberDetail(id: string): Promise<void> {
  if (!id) {
    return;
  }

  selectedId = id;
  if (memberRows) {
    memberRows.querySelectorAll("tr").forEach((row) => {
      row.classList.toggle("is-selected", row.dataset.memberId === id);
    });
  }

  try {
    const response = await getUserById(id);
    const member = response.data ?? response.item;
    if (!member) {
      setFormStatus("회원 정보를 불러오지 못했습니다.", "error");
      return;
    }
    populateForm(member);
  } catch (error) {
    console.error(error);
    setFormStatus("회원 정보를 불러오지 못했습니다.", "error");
  }
}

function validateForm(): boolean {
  clearFieldMessages();

  const nameValue = fieldElements.name?.value.trim() ?? "";
  const emailValue = fieldElements.email?.value.trim() ?? "";
  let valid = true;

  if (nameValue.length < 2) {
    setFieldMessage("name", "이름은 2자 이상 입력해주세요.");
    valid = false;
  }

  if (emailValue.length === 0) {
    setFieldMessage("email", "이메일을 입력해주세요.");
    valid = false;
  } else if (!/^[\w.-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(emailValue)) {
    setFieldMessage("email", "올바른 이메일 형식이 아니에요.");
    valid = false;
  }

  return valid;
}

async function handleUpdate(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  if (!memberForm || !fieldElements._id) {
    return;
  }

  if (!validateForm()) {
    setFormStatus("입력 정보를 확인해주세요.", "error");
    return;
  }

  const id = fieldElements._id.value;
  if (!id) {
    setFormStatus("선택된 회원이 없습니다.", "error");
    return;
  }

  setFormStatus("회원 정보를 저장하고 있어요...", "info");

  try {
    const result: ApiItemResponse<User> = await updateUser(id, {
      name: fieldElements.name?.value.trim(),
      email: fieldElements.email?.value.trim(),
    });

    if (!result.ok) {
      setFormStatus(result.message ?? "회원 정보를 저장하지 못했습니다.", "error");
      return;
    }

    const updatedMember = result.data ?? result.item;
    if (updatedMember) {
      members = members.map((member) => (member._id === id ? { ...member, ...updatedMember } : member));
      applySearch(searchInput?.value ?? "");
      renderMemberList();
      populateForm(updatedMember);
    }

    setFormStatus("회원 정보를 저장했어요.", "success");
  } catch (error) {
    console.error(error);
    setFormStatus("회원 정보를 저장하지 못했습니다.", "error");
  }
}

async function handleDelete(): Promise<void> {
  if (!fieldElements._id) {
    return;
  }

  const id = fieldElements._id.value;
  if (!id) {
    setFormStatus("삭제할 회원이 선택되지 않았습니다.", "error");
    return;
  }

  if (!confirm("선택한 회원을 정말 삭제할까요?")) {
    return;
  }

  setFormStatus("회원 정보를 삭제하고 있어요...", "info");

  try {
    const result = await deleteUser(id);
    if (!result.ok) {
      setFormStatus(result.message ?? "회원 삭제에 실패했습니다.", "error");
      return;
    }

    members = members.filter((member) => member._id !== id);
    applySearch(searchInput?.value ?? "");
    renderMemberList();

    memberForm?.reset();
    memberForm && (memberForm.hidden = true);
    placeholder?.removeAttribute("hidden");
    setFormStatus("회원 정보를 삭제했어요.", "success");
  } catch (error) {
    console.error(error);
    setFormStatus("회원 삭제에 실패했습니다.", "error");
  }
}

function bindEvents(): void {
  memberForm?.addEventListener("submit", (event) => {
    void handleUpdate(event);
  });

  deleteButton?.addEventListener("click", () => {
    void handleDelete();
  });

  refreshButton?.addEventListener("click", () => {
    void loadMembers();
  });

  searchInput?.addEventListener("input", () => {
    applySearch(searchInput.value);
    renderMemberList();
  });
}

async function init(): Promise<void> {
  bindEvents();
  await loadMembers();
}

void init();
