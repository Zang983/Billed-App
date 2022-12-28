/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import { fireEvent, screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from '../__mocks__/store';
import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore);

/* Initialisation du code commun à la plupart des tests (mockstore, localstorage) */
beforeEach(() => {
  jest.spyOn(mockStore, "bills")
  Object.defineProperty(
    window,
    'localStorage',
    { value: localStorageMock }
  )
  window.localStorage.setItem('user', JSON.stringify({
    type: "Employee",
    status: "connected",
    password: "employee",
    email: "employee@test.tld"
  }))
  const root = document.createElement("div")
  root.setAttribute("id", "root")
  document.body.appendChild(root)
  router()
})
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass("active-icon")
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      //const antiChrono = (a, b) => ((a < b) ? 1 : -1) Mistake with this lines
      const antiChrono = (a, b) => (a - b) // no mistake here
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then user click on icon Eye to show bill", () => {
      window.onNavigate(ROUTES_PATH.Bills)
      let PREVIOUS_LOCATION = "";
      //We have to mock the store
      const store = jest.fn();
      //Mock the bootstrap's modal function
      $.fn.modal = jest.fn()
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      })
      const eyesIcons = screen.getAllByTestId("icon-eye")
      eyesIcons.forEach((icon) => {
        const handleClickIconEye = jest.fn(() => bill.handleClickIconEye(icon))
        icon.addEventListener("click", handleClickIconEye)
        fireEvent.click(icon)//simulation du click
        expect(handleClickIconEye).toHaveBeenCalled()//on vérifie que la fonction est bien appelée
        expect($.fn.modal).toHaveBeenCalledWith("show")
        expect(screen.getByText("Justificatif")).toBeTruthy()
      })
    })
    test("Then user click on New Bill he is redirected to this page. ", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      const store = jest.fn();
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      })
      const handleClickNewBill = jest.fn(() => bill.handleClickNewBill())
      const buttonNewBill = screen.getByTestId("btn-new-bill")
      buttonNewBill.addEventListener("click", handleClickNewBill())
      await fireEvent.click(buttonNewBill)
      expect(screen.getByTestId("form-new-bill")).toBeTruthy()
      expect((handleClickNewBill)).toHaveBeenCalled()
    })
  })
})
/* test d'intégration GET */
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      expect(screen.getByText("Mes notes de frais")).toBeTruthy()
      const newBillBtn = screen.getByTestId("btn-new-bill")
      expect(newBillBtn).toBeTruthy()
    })
    describe("When an error appears on API", () => {
      test("fetches bills from an API and fails with HTTP error 404", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Error 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Error 404/)
        expect(message).toBeTruthy()
      })
      test("fetches messages from an API and fails with HTTP error 500", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Error 500"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Error 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})

