/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

describe('RUN PIPELINE MODAL', () => {
  const gitSyncCall =
    '/ng/api/git-sync/git-sync-enabled?accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const pipelineSave =
    '/pipeline/api/pipelines?accountIdentifier=accountId&projectIdentifier=project1&orgIdentifier=default'
  const inputSetsTemplateCall =
    '/pipeline/api/inputSets/template?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&pipelineIdentifier=testPipeline_Cypress&projectIdentifier=project1'
  const pipelineDetailsCall =
    '/pipeline/api/pipelines/testPipeline_Cypress?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const resolvedPipelineDetailsCall =
      '/template/api/templates/applyTemplates?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&pipelineIdentifier=testPipeline_Cypress&projectIdentifier=project1'
  const inputSetsGetCall =
    '/pipeline/api/inputSets?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1&pipelineIdentifier=testPipeline_Cypress'
  const pipelineVariablesCall =
      '/pipeline/api/pipelines/variables?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const servicesCall =
      '/ng/api/servicesV2?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const environmentsCall =
      '/ng/api/environmentsV2?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
  const connectorsCall =
      '/ng/api/connectors?accountIdentifier=accountId&type=K8sCluster&searchTerm=&projectIdentifier=project1&orgIdentifier=default'
  const stagesExecutionListCall =
      '/pipeline/api/pipeline/execute/stagesExecutionList?routingId=px7xd_BFRCi-pfWPYXVjvw&accountIdentifier=px7xd_BFRCi-pfWPYXVjvw&orgIdentifier=default&projectIdentifier=Kapil&pipelineIdentifier=My_test_pipeline'
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.intercept('GET', gitSyncCall, { connectivityMode: null, gitSyncEnabled: false })
    cy.login('test', 'test')

    cy.visitCreatePipeline()

    cy.fillName('testPipeline_Cypress')

    cy.clickSubmit()
  })

  describe('Tests close without saving dialog for pipeline', () => {
    it('should display the close without saving dialog for pipeline', () => {
      cy.contains('p', 'Pipelines').click()
      cy.contains('p', 'Close without saving?').should('be.visible')
      cy.contains('span', 'Confirm').click({ force: true })
      cy.wait(2000)
      cy.contains('span', 'Create a Pipeline').should('be.visible')
    })
  })

  describe('For deploy stage', () => {

    beforeEach(() => {
      cy.get('[icon="plus"]').click()
      cy.findByTestId('stage-Deployment').click()

      cy.fillName('testStage_Cypress')
      cy.clickSubmit()
    })

    it('should display the delete pipeline stage modal', () => {
      cy.wait(2000)
      cy.get('[icon="play"]').click({ force: true })
      cy.wait(2000)
      cy.contains('p', 'testStage_Cypress').trigger('mouseover')
      cy.get('[icon="cross"]').click({ force: true })
      cy.contains('p', 'Delete Pipeline Stage').should('be.visible')
      cy.contains('span', 'Delete').click({ force: true })
      cy.contains('span', 'Pipeline Stage Successfully removed.').should('be.visible')
    })

    it('should display the field errors if form is invalid', () => {
      cy.intercept('POST', pipelineSave, { fixture: 'pipeline/api/pipelines.postsuccess' })
      cy.intercept('POST', inputSetsTemplateCall, { fixture: 'pipeline/api/runpipeline/inputsettemplate' })
      cy.intercept('GET', pipelineDetailsCall, { fixture: 'pipeline/api/runpipeline/getpipeline' })
      cy.intercept('POST', resolvedPipelineDetailsCall, { fixture: 'template/api/getresolvedpipeline' })
      cy.intercept('GET', inputSetsGetCall, { fixture: 'pipeline/api/runpipeline/getinputsets' })
      cy.intercept('GET', stagesExecutionListCall, { fixture: 'pipeline/api/pipeline/execute/stagesExecutionList' })

      cy.contains('span', 'Save').click({ force: true })
      cy.contains('span', 'Pipeline published successfully').should('be.visible')

      cy.findByTestId('card-run-pipeline').click()
      cy.contains('span', 'Run Pipeline').click()

      cy.contains('span', 'Service is required').should('be.visible').should('have.class', 'FormError--error')
      cy.contains('span', 'ConnectorRef is a required field')
          .should('be.visible')
          .should('have.class', 'FormError--error')
      cy.contains('span', 'Image Path is a required field').should('be.visible').should('have.class', 'FormError--error')
      cy.contains('span', 'Tag is a required field').should('be.visible').should('have.class', 'FormError--error')
    })

    describe('Checks visual to YAML and visual to variable view parity', () => {
      beforeEach(() => {
        cy.intercept('GET', servicesCall, { fixture: 'ng/api/servicesV2' })
        cy.intercept('GET', environmentsCall, { fixture: 'ng/api/environmentsV2' })
        cy.intercept('GET', connectorsCall, { fixture: 'ng/api/connectors' })
        cy.intercept('POST', pipelineVariablesCall, { fixture: 'pipeline/api/runpipeline/pipelines.variables' })

        cy.wait(1000)

        // Service tab config
        cy.get('input[name="serviceRef"]').click({ force: true })
        cy.contains('p', 'testService').click({ force: true })
        cy.wait(1000)

        // Infrastructure tab config
        cy.contains('span', 'Infrastructure').click({ force: true })
        cy.wait(1000)
        cy.get('input[name="environmentRef"]').click({ force: true })
        cy.contains('p', 'testEnv').click({ force: true })
        cy.wait(1000)

        cy.contains('p', /^Kubernetes$/).click();
        cy.wait(1000)

        cy.contains('span', 'Select Connector').click({ force: true })
        cy.contains('p', 'test1111').click({ force: true })
        cy.contains('span', 'Apply Selected').click({ force: true })

        cy.fillField('namespace', 'cypress')
        cy.wait(1000)
      })

      it('visual to YAML conversion for stage configuration', () => {

        // Toggle to YAML view

        cy.get('[data-name="toggle-option-two"]').click({ force: true })
        cy.wait(1000)

        cy.contains('div', 'Unsaved changes').should('be.visible')
        //Verify all details in YAML view
        cy.contains('span', 'testPipeline_Cypress').should('be.visible')
        cy.contains('span', 'testStage_Cypress').should('be.visible')
        cy.contains('span', 'Deployment').should('be.visible')

        cy.contains('span', 'serviceRef').should('be.visible')
        cy.contains('span', 'testService').should('be.visible')

        cy.contains('span', 'environmentRef').should('be.visible')
        cy.contains('span', 'testEnv').should('be.visible')

        cy.contains('span', 'KubernetesDirect').should('be.visible')

        cy.contains('span', 'connectorRef').should('be.visible')
        cy.contains('span', 'test1111').should('be.visible')

        cy.contains('span', 'namespace').should('be.visible')
        cy.contains('span', 'cypress').should('be.visible')
      })

      it('visual to variable view for stage configuration', () => {
        // Toggle to variable view
        cy.contains('span', 'Variables').click()
        cy.wait(2000)

        cy.get('#pipeline-panel').contains('span', 'testPipeline_Cypress').should('be.visible')
        cy.get('#pipeline-panel').contains('span', 'testStage_Cypress').should('be.visible')
        cy.get('#pipeline-panel').contains('span', 'environmentRef').should('be.visible')
        cy.get('#pipeline-panel').contains('span', 'testEnv').should('be.visible')

        cy.get('#pipeline-panel').contains('span', 'connectorRef').should('be.visible')
        cy.get('#pipeline-panel').contains('span', 'test1111').should('be.visible')

        cy.get('#pipeline-panel').contains('span', 'namespace').should('be.visible')
        cy.get('#pipeline-panel').contains('span', 'cypress').should('be.visible')
      })
    })
  })
})