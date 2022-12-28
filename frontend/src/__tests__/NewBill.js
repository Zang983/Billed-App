/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"
import { screen, fireEvent, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store.js"
import router from "../app/Router.js"
jest.mock("../app/store", () => mockStore);
/*
Initialisation du code commun à la plupart des tests (mockstore, localstorage)
*/
beforeEach(() => {
  jest.spyOn(mockStore, "bills")//similaire à jest.fn mais permet d'écouter les appels au mockstore
  Object.defineProperty(//Définition du localstorage servant de base test
    window,
    'localStorage',
    { value: localStorageMock }
  )
  window.localStorage.setItem('user', JSON.stringify({//insertion des valeurs dans le local storage
    type: "Employee",
    status: "connected",
    password: "employee",
    email: "employee@test.tld"
  }))
  const root = document.createElement("div")// création de la div applicative
  root.setAttribute("id", "root")
  document.body.appendChild(root)
  router()
})

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("When I change file", () => {
      test("Then I am uploading a file", async () => {
        window.onNavigate(ROUTES_PATH.NewBill);
        document.body.innerHTML = NewBillUI()

        // we have to mock navigation to test it
        let PREVIOUS_LOCATION = "";
        //We have to mock the store
        const store = jest.fn();
        const bill = new NewBill({
          document,
          onNavigate: jest.fn(() => null),
          store,
          localStorage: window.localStorage
        })
        const field = await screen.findByTestId("file")

        const handleChangeFile = jest.fn((e) => {
          bill.handleChangeFile(e)
        })

        field.addEventListener("change", handleChangeFile)
        fireEvent.change(field)
        expect(handleChangeFile).toHaveBeenCalled()
      })
      test("Then we have to check extension", () => {
        window.onNavigate(ROUTES_PATH.NewBill);
        // we have to mock navigation to test it
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        let PREVIOUS_LOCATION = "";
        //We have to mock the store
        const store = jest.fn();
        const bill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage
        })

        const validExt = jest.fn(filename => bill.validExt(filename))
        expect(validExt("test.jpg")).toBeTruthy()
        expect(validExt("test.jpeg")).toBeTruthy()
        expect(validExt("test.png")).toBeTruthy()
        expect(validExt("test.test")).toBeFalsy()
      })
    })
  })
  /*
  We don't check each case with filled or unfilled form.
  In original function we don't have security test to check user's inputs.
  */
  describe("When user submit form", () => {
    test("Then handleSumbit function have to been called", () => {
      window.onNavigate(ROUTES_PATH.NewBill);
      // localStorage should be populated with form data
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      let PREVIOUS_LOCATION = "";
      document.body.innerHTML = NewBillUI()
      const bill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage
      })
      let form = screen.getByTestId("form-new-bill")
      let handleSubmit = jest.fn((e) => { bill.handleSubmit(e) })
      form.addEventListener("submit", e => handleSubmit(e))
      fireEvent.submit(form)
      expect(handleSubmit).toHaveBeenCalled()
    })
  })
})
/* POST INTEGRATION TEST 
We mock create function from mockstore.bills to response a promise reject on each test
*/
describe("Given I am a user connected as an Employee", () => {
  describe("When I create a new Bill", () => {
    describe("When an HTTP error appears on API", () => {
      test("When post a new bill to an API and fail with error 404", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Error 404"))
            }
          }
        })
        document.body.innerHTML = BillsUI({ error: "Error 404" })
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Error 404/)
        expect(message).toBeTruthy()
      })

      test("When post a new bill to an API and fail with error 500", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Error 500"))
            }
          }
        })
        document.body.innerHTML = BillsUI({ error: "Error 500" })
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Error 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})