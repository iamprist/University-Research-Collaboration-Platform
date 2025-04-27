// __mocks__/firebase.js
export const auth = {
    signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: '123' } }),
    createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: '123' } }),
    onAuthStateChanged: jest.fn(),
  };
  
  export const firebase = {
    auth: jest.fn().mockReturnValue(auth),
  };
  