// /webapp/src/utils/mock.js
// Lightweight mock data for local frontend testing without backend
// ReminderApp Ver.2.8.1

import { getCurrentJSTDate, formatDate, addDays } from "./datejs";

/**
 * Generate mock user data
 * @param {string} lineUserId - LINE user ID
 * @param {string} role - "general" or "admin"
 * @returns {object} Mock user object
 */
export function mockUser(lineUserId = "U1234567890abcdef", role = "general") {
  return {
    line_user_id: lineUserId,
    name: role === "admin" ? "管理者テスト" : "一般ユーザー",
    name_kana: role === "admin" ? "カンリシャテスト" : "イッパンユーザー",
    enrollment_year: 2024,
    role: role,
    notification_settings: {
      duty_remind: true,
      meal_remind: true
    },
    created_at: new Date("2024-04-01"),
    last_login: getCurrentJSTDate()
  };
}

/**
 * Generate mock duties for a date range
 * @param {Date} startDate - Start date
 * @param {number} days - Number of days to generate
 * @param {string} userId - User LINE ID
 * @returns {Array} Array of mock duty objects
 */
export function mockDuties(startDate, days = 7, userId = "U1234567890abcdef") {
  const duties = [];
  const dutyTypes = ["cleaning", "cooking", "trash"];
  
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const dutyType = dutyTypes[i % dutyTypes.length];
    
    duties.push({
      id: `duty_${formatDate(date)}_${dutyType}`,
      duty_date: date,
      duty_type: dutyType,
      user_line_id: userId,
      is_completed: i < 2, // First 2 days completed
      completed_at: i < 2 ? addDays(date, 0) : null
    });
  }
  
  return duties;
}

/**
 * Generate mock meal votes for a week
 * @param {Date} startDate - Start of week (Monday)
 * @param {string} userId - User LINE ID
 * @returns {Array} Array of mock meal vote objects
 */
export function mockMealVotes(startDate, userId = "U1234567890abcdef") {
  const votes = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    
    votes.push({
      id: `vote_${formatDate(date)}_${userId}`,
      user_line_id: userId,
      meal_date: date,
      votes: {
        breakfast: i !== 6, // No breakfast on Sunday
        dinner: i !== 0 && i !== 6 // No dinner on Monday and Sunday
      },
      created_at: addDays(startDate, -3),
      updated_at: addDays(startDate, -1)
    });
  }
  
  return votes;
}

/**
 * Generate mock holidays
 * @returns {Array} Array of mock holiday objects
 */
export function mockHolidays() {
  const currentYear = getCurrentJSTDate().getFullYear();
  
  return [
    {
      id: "holiday_newyear",
      type: "national",
      description: "年末年始",
      skip_duty: true,
      skip_meal: true,
      range: {
        start: new Date(currentYear, 11, 28),
        end: new Date(currentYear + 1, 0, 5)
      }
    },
    {
      id: "holiday_golden_week",
      type: "national",
      description: "ゴールデンウィーク",
      skip_duty: true,
      skip_meal: false,
      range: {
        start: new Date(currentYear, 4, 1),
        end: new Date(currentYear, 4, 7)
      }
    },
    {
      id: "holiday_summer",
      type: "academic",
      description: "夏季休暇",
      skip_duty: true,
      skip_meal: true,
      range: {
        start: new Date(currentYear, 7, 10),
        end: new Date(currentYear, 8, 15)
      }
    }
  ];
}

/**
 * Generate mock duty swap requests
 * @param {string} requesterId - Requester LINE ID
 * @param {string} targetId - Target LINE ID
 * @returns {Array} Array of mock swap objects
 */
export function mockDutySwaps(
  requesterId = "U1234567890abcdef",
  targetId = "U0987654321fedcba"
) {
  const today = getCurrentJSTDate();
  
  return [
    {
      id: "swap_001",
      duty_id: "duty_001",
      requester_id: requesterId,
      target_id: targetId,
      status: "pending",
      requested_at: addDays(today, -2),
      original_date: addDays(today, 3),
      reason: "用事があるため"
    },
    {
      id: "swap_002",
      duty_id: "duty_002",
      requester_id: requesterId,
      target_id: targetId,
      status: "approved",
      requested_at: addDays(today, -5),
      responded_at: addDays(today, -4),
      original_date: addDays(today, -1),
      reason: "体調不良"
    }
  ];
}

/**
 * Mock Firestore query result
 * @param {Array} data - Array of documents
 * @returns {object} Mock query snapshot
 */
export function mockQuerySnapshot(data) {
  return {
    docs: data.map(doc => ({
      id: doc.id,
      data: () => doc,
      exists: true
    })),
    empty: data.length === 0,
    size: data.length,
    forEach: (callback) => {
      data.forEach((doc, index) => {
        callback({
          id: doc.id,
          data: () => doc,
          exists: true
        }, index);
      });
    }
  };
}

/**
 * Mock Firestore document reference
 * @param {object} data - Document data
 * @returns {object} Mock document reference
 */
export function mockDocRef(data) {
  return {
    id: data.id,
    get: async () => ({
      id: data.id,
      data: () => data,
      exists: true
    }),
    set: async (newData) => {
      Object.assign(data, newData);
      return { id: data.id };
    },
    update: async (updates) => {
      Object.assign(data, updates);
      return { id: data.id };
    },
    delete: async () => {
      return { id: data.id };
    }
  };
}

/**
 * Mock LINE authentication response
 * @param {string} userId - LINE user ID
 * @param {string} role - User role
 * @returns {object} Mock auth response
 */
export function mockLineAuthResponse(
  userId = "U1234567890abcdef",
  role = "general"
) {
  return {
    success: true,
    user: mockUser(userId, role),
    customToken: `mock_token_${userId}_${Date.now()}`,
    accessToken: `mock_access_${userId}`
  };
}

/**
 * Mock Cloud Function response
 * @param {boolean} success - Success status
 * @param {object} data - Response data
 * @returns {object} Mock function response
 */
export function mockFunctionResponse(success = true, data = {}) {
  return {
    success,
    ...data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Enable mock mode globally
 * Stores flag in sessionStorage
 */
export function enableMockMode() {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("MOCK_MODE", "true");
  }
}

/**
 * Disable mock mode globally
 */
export function disableMockMode() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("MOCK_MODE");
  }
}

/**
 * Check if mock mode is enabled
 * @returns {boolean}
 */
export function isMockMode() {
  if (typeof window !== "undefined") {
    return window.sessionStorage.getItem("MOCK_MODE") === "true";
  }
  return false;
}