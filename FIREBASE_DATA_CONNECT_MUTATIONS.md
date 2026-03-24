# Firebase Data Connect - GraphQL Mutations for Zenith Schema

## User Mutations

mutation CreateUser($firebaseAuthUid: String!, $email: String!, $displayName: String, $photoUrl: String) {
  insertUsers(data: [{
    firebaseAuthUid: $firebaseAuthUid
    email: $email
    displayName: $displayName
    photoUrl: $photoUrl
    credits: 50
    createdAt: now()
  }]) {
    firebaseAuthUid
    email
    credits
  }
}

mutation UpdateUser($firebaseAuthUid: String!, $displayName: String, $photoUrl: String) {
  updateUsers(
    where: { firebaseAuthUid: $firebaseAuthUid }
    data: {
      displayName: $displayName
      photoUrl: $photoUrl
    }
  ) {
    firebaseAuthUid
    displayName
    photoUrl
  }
}

mutation UpdateLastLogin($firebaseAuthUid: String!) {
  updateUsers(
    where: { firebaseAuthUid: $firebaseAuthUid }
    data: {
      lastLoginAt: now()
    }
  ) {
    firebaseAuthUid
    lastLoginAt
  }
}

## Business Plan Mutations

mutation CreateBusinessPlan($firebaseAuthUid: String!, $title: String!, $content: String!, $description: String, $industry: String) {
  insertBusinessPlans(data: [{
    id: generateId()
    user: { firebaseAuthUid: $firebaseAuthUid }
    title: $title
    content: $content
    description: $description
    industry: $industry
    status: "completed"
    createdAt: now()
    updatedAt: now()
  }]) {
    id
    title
    status
    createdAt
  }
}

mutation UpdateBusinessPlan($id: String!, $title: String, $content: String, $description: String, $status: String) {
  updateBusinessPlans(
    where: { id: $id }
    data: {
      title: $title
      content: $content
      description: $description
      status: $status
      updatedAt: now()
    }
  ) {
    id
    title
    status
    updatedAt
  }
}

mutation DeleteBusinessPlan($id: String!) {
  deleteBusinessPlans(where: { id: $id }) {
    id
  }
}

## Content Generation Mutations

mutation CreateContentGeneration(
  $firebaseAuthUid: String!
  $type: String!
  $title: String!
  $prompt: String!
  $generatedText: String!
  $usageCredits: Int!
  $status: String!
) {
  insertContentGenerations(data: [{
    id: generateId()
    user: { firebaseAuthUid: $firebaseAuthUid }
    type: $type
    title: $title
    prompt: $prompt
    generatedText: $generatedText
    usageCredits: $usageCredits
    status: $status
    createdAt: now()
  }]) {
    id
    type
    title
    status
  }
}

mutation UpdateContentGeneration($id: String!, $title: String, $generatedText: String, $status: String) {
  updateContentGenerations(
    where: { id: $id }
    data: {
      title: $title
      generatedText: $generatedText
      status: $status
    }
  ) {
    id
    title
    status
  }
}

## AI Chat Session Mutations

mutation CreateChatSession($firebaseAuthUid: String!, $title: String!) {
  insertChatSessions(data: [{
    id: generateId()
    user: { firebaseAuthUid: $firebaseAuthUid }
    title: $title
    createdAt: now()
    updatedAt: now()
  }]) {
    id
    title
    createdAt
  }
}

mutation UpdateChatSession($id: String!, $title: String) {
  updateChatSessions(
    where: { id: $id }
    data: {
      title: $title
      updatedAt: now()
    }
  ) {
    id
    title
  }
}

## AI Chat Message Mutations

mutation AddChatMessage(
  $sessionId: String!
  $firebaseAuthUid: String!
  $role: String!
  $message: String!
  $usageCredits: Int
) {
  insertChatMessages(data: [{
    id: generateId()
    session: { id: $sessionId }
    user: { firebaseAuthUid: $firebaseAuthUid }
    role: $role
    message: $message
    usageCredits: $usageCredits
    createdAt: now()
  }]) {
    id
    role
    message
    createdAt
  }
}

## Credit Mutations

mutation AddCredits($firebaseAuthUid: String!, $amount: Int!) {
  updateUsers(
    where: { firebaseAuthUid: $firebaseAuthUid }
    data: {
      credits: { increment: $amount }
    }
  ) {
    credits
  }
}

mutation DeductCredits($firebaseAuthUid: String!, $amount: Int!) {
  updateUsers(
    where: { firebaseAuthUid: $firebaseAuthUid }
    data: {
      credits: { increment: -$amount }
    }
  ) {
    credits
  }
}

mutation CreateCreditTransaction(
  $firebaseAuthUid: String!
  $type: String!
  $amount: Int!
  $description: String
  $associatedEntityId: String
) {
  insertCreditTransactions(data: [{
    id: generateId()
    user: { firebaseAuthUid: $firebaseAuthUid }
    type: $type
    amount: $amount
    description: $description
    associatedEntityId: $associatedEntityId
    createdAt: now()
  }]) {
    id
    type
    amount
    createdAt
  }
}
