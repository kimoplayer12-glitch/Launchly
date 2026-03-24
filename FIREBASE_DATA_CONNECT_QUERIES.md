# Firebase Data Connect - GraphQL Queries for Zenith Schema

## User Queries

query GetUser($firebaseAuthUid: String!) {
  users(where: { firebaseAuthUid: $firebaseAuthUid }) {
    firebaseAuthUid
    email
    createdAt
    credits
    displayName
    photoUrl
    lastLoginAt
  }
}

query GetUserWithData($firebaseAuthUid: String!) {
  users(where: { firebaseAuthUid: $firebaseAuthUid }) {
    firebaseAuthUid
    email
    credits
    displayName
    businessPlans {
      id
      title
      status
      createdAt
    }
    contentGenerations {
      id
      type
      title
      status
      createdAt
    }
    chatSessions {
      id
      title
      lastMessageAt
    }
    creditTransactions {
      id
      type
      amount
      createdAt
    }
  }
}

## Business Plan Queries

query GetBusinessPlan($id: String!) {
  businessPlans(where: { id: $id }) {
    id
    title
    content
    description
    industry
    status
    createdAt
    updatedAt
    user {
      email
      displayName
    }
  }
}

query GetUserBusinessPlans($firebaseAuthUid: String!) {
  businessPlans(where: { user: { firebaseAuthUid: $firebaseAuthUid } }) {
    id
    title
    description
    industry
    status
    createdAt
    updatedAt
  }
}

## Content Generation Queries

query GetContentGeneration($id: String!) {
  contentGenerations(where: { id: $id }) {
    id
    type
    title
    prompt
    generatedText
    status
    usageCredits
    createdAt
    user {
      email
    }
  }
}

query GetUserContentGenerations($firebaseAuthUid: String!) {
  contentGenerations(where: { user: { firebaseAuthUid: $firebaseAuthUid } }) {
    id
    type
    title
    status
    usageCredits
    createdAt
  }
}

query GetUserContentByType($firebaseAuthUid: String!, $type: String!) {
  contentGenerations(where: { 
    user: { firebaseAuthUid: $firebaseAuthUid }
    type: $type
  }) {
    id
    title
    generatedText
    status
    createdAt
  }
}

## AI Chat Session Queries

query GetChatSession($id: String!) {
  chatSessions(where: { id: $id }) {
    id
    title
    createdAt
    updatedAt
    lastMessageAt
    messages(orderBy: createdAt_ASC) {
      id
      role
      message
      createdAt
      usageCredits
    }
  }
}

query GetUserChatSessions($firebaseAuthUid: String!) {
  chatSessions(where: { user: { firebaseAuthUid: $firebaseAuthUid } }) {
    id
    title
    createdAt
    updatedAt
    lastMessageAt
  }
}

query GetChatSessionMessages($sessionId: String!) {
  chatSessions(where: { id: $sessionId }) {
    messages(orderBy: createdAt_ASC) {
      id
      role
      message
      createdAt
      usageCredits
      user {
        displayName
      }
    }
  }
}

## Credit Queries

query GetUserCredits($firebaseAuthUid: String!) {
  users(where: { firebaseAuthUid: $firebaseAuthUid }) {
    credits
  }
}

query GetCreditTransactions($firebaseAuthUid: String!) {
  creditTransactions(where: { user: { firebaseAuthUid: $firebaseAuthUid } }) {
    id
    type
    amount
    createdAt
    description
  }
}

query GetCreditTransactionsByType($firebaseAuthUid: String!, $type: String!) {
  creditTransactions(where: { 
    user: { firebaseAuthUid: $firebaseAuthUid }
    type: $type
  }) {
    id
    amount
    createdAt
    description
  }
}

query GetUserCreditBalance($firebaseAuthUid: String!) {
  users(where: { firebaseAuthUid: $firebaseAuthUid }) {
    credits
    creditTransactions(orderBy: createdAt_DESC) {
      id
      type
      amount
      createdAt
    }
  }
}
