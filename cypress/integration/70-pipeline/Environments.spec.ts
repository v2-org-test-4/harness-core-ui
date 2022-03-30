import { environmentRoute, environmentsCall } from '../../support/70-pipeline/constants'

describe('Environment for Pipeline', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.visit(environmentRoute, {
      timeout: 30000
    })
  })

  it('Environment Addition & YAML/visual parity', () => {
    cy.intercept('GET', environmentsCall, { fixture: 'ng/api/environments/environments.empty.json' }).as(
      'emptyEnvironments'
    )
    cy.wait(1000)
    cy.wait('@emptyEnvironments')
    cy.wait(500)
    cy.contains('h2', 'No Environments Available').should('be.visible')
    cy.contains('span', 'New Environment').should('be.visible')
    cy.contains('span', 'New Environment').click()

    cy.fillName('testEnv')
    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Environment Description')
    cy.contains('textarea', 'Test Environment Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('envTag').type('{enter}')
    cy.contains('span', 'envTag').should('be.visible')
    cy.contains('p', 'Production').click()

    // YAML assertion
    cy.get('[data-name="toggle-option-two"]').click()

    cy.contains('span', 'testEnv').should('be.visible')
    cy.contains('span', 'Test Environment Description').should('be.visible')
    cy.contains('span', 'envTag').should('be.visible')
    cy.contains('span', 'Production').should('be.visible')

    // Saving
    cy.contains('span', 'Save').click()
    cy.wait(1000)
    cy.contains('span', 'Environment created successfully').should('be.visible')
  })

  it('Environment Assertion and Deletion', () => {
    cy.intercept('GET', environmentsCall, { fixture: 'ng/api/environments/environmentsList.json' }).as(
      'environmentsList'
    )
    cy.wait(1000)
    cy.wait('@environmentsList')
    cy.wait(1000)
    cy.contains('p', 'testEnv').should('be.visible')
    cy.contains('p', 'Test Environment Description').should('be.visible')
    cy.contains('p', 'Production').should('be.visible')

    cy.get('span[data-icon="main-tags"]').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseover')
    cy.contains('p', 'TAGS').should('be.visible')

    cy.get('span[data-icon="Options"]').should('be.visible')
    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Delete').click()

    cy.contains('span', 'Confirm').should('be.visible')
    cy.contains('span', 'Confirm').click()
    cy.wait(1000)
    cy.contains('span', 'Successfully deleted environment testEnv').should('be.visible')
  })
})