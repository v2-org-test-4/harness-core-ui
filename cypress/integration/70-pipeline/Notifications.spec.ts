describe('PIPELINE NOTIFICATIONS FLOW', () => {

    const gitSyncCall =
        '/ng/api/git-sync/git-sync-enabled?accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'
    const userGroupsCall =
        '/ng/api/aggregate/acl/usergroups?accountIdentifier=accountId&searchTerm='
    const pipelineVariablesCall =
        '/pipeline/api/pipelines/variables?routingId=accountId&accountIdentifier=accountId&orgIdentifier=default&projectIdentifier=project1'

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

    it('should be able to configure notifications and check in notification list view', () => {

        cy.intercept('GET', userGroupsCall, { fixture: 'ng/api/aggregate/usergroups' })
        cy.intercept('POST', pipelineVariablesCall, { fixture: 'pipeline/api/notifications/pipelines.variables' })

        cy.wait(1000)
        cy.contains('span', 'Notify').click()
        cy.wait(1000)
        cy.get('#newNotificationBtn').click()
        cy.fillField('name', 'cypress notification')
        cy.clickSubmit()
        cy.get('input[name="types.AllEvents"]').click({ force: true })
        cy.clickSubmit()

        cy.contains('p', 'Notification Method').should('be.visible')

        cy.get('.bp3-dialog').find('input[placeholder="- Select -"]').click({ force: true })
        cy.contains('p', 'Email').click({ force: true })

        cy.wait(1000)
        cy.fillField('emailIds', 'abc@gmail.com')

        cy.contains('p', 'Select User Group(s)').click({ force: true })
        cy.wait(2000)
        cy.contains('p', 'PrateekTest001').click({ force: true })
        cy.contains('span', 'Apply Selected').click({ force: true })
        cy.wait(1000)
        cy.clickSubmit()


        cy.wait(1000)


        cy.contains('p', 'cypress notification').should('be.visible')
        cy.contains('span', 'All Events').should('be.visible')
        cy.contains('p', 'Email').should('be.visible')
    })

})