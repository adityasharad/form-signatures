/**
 * @OnlyCurrentDoc
 * Ensures that this script only requests permission for the form that uses it,
 * and not any other Google Drive files.
 */

/** Runs when the form is opened for editing. Adds new items to the menu for the form editor to interact with. */
function onOpen() {
  FormApp.getUi()
      .createMenu('Configure form signatures')
      .addItem('Set up', 'openSidebar')
      .addToUi();
}

/** Opens a new sidebar in the Forms editor, created from an HTML template. */
function openSidebar() {
  // Fill in the template from sidebar.html, using the current state of the form on the server.
  const html = HtmlService.createTemplateFromFile('sidebar').evaluate()
  html.setTitle('Configure form signatures')
  // Show the sidebar.
  FormApp.getUi().showSidebar(html)
}

/** Gets the current section titles. Used by the form editor UI. */
function getCurrentSectionTitles() {
  return {
    'nameSection': getNameSectionTitle_(),
    'categorySection': getCategorySectionTitle_() || 'none',
    'signaturesSection': getSignaturesSectionTitle_()
  }
}

/** Processes a response from the mini-form within the form editor UI. This tells us which sections of the form to use. */
function setCurrentSectionTitles(formResponseObject) {
  Logger.log(
    'Processing form response: %s %s %s',
    formResponseObject.nameSection,
    formResponseObject.categorySection,
    formResponseObject.signaturesSection
  )
  // Set the name section.
  const nameSection = getSectionFromForm_(FormApp.ItemType.TEXT, formResponseObject.nameSection)
  if(nameSection === undefined) {
    throw new Error('Name section $s no longer exists', formResponseObject.nameSection)
  }
  setNameSectionTitle_(formResponseObject.nameSection)
  
  // Set the category section.
  if(formResponseObject.categorySection === 'none') {
    clearCategorySectionTitle_()
  } else {
    const categorySection = getSectionFromForm_(FormApp.ItemType.TEXT, formResponseObject.categorySection)
    if(categorySection === undefined) {
      throw new Error('Category section %s no longer exists', formResponseObject.categorySection)
    }
    setCategorySectionTitle_(formResponseObject.categorySection)
  }
  
  // Set the signatures section.
  const signaturesSection = getSectionFromForm_(FormApp.ItemType.SECTION_HEADER, formResponseObject.signaturesSection)
  if(signaturesSection === undefined) {
    throw new Error('Signatures section %s no longer exists', formResponseObject.signaturesSection)
  }
  setSignaturesSectionTitle_(formResponseObject.signaturesSection)
}

/** Creates a section in the form to hold the list of all signatures. */
function createSignaturesSection() {
  const ui = FormApp.getUi()
  const form = FormApp.getActiveForm()
  const response = ui.prompt(
    'Create form signatures section',
    'We will create a new section in the form to hold the list of all signatures. Please enter a name for the new section:',
    ui.ButtonSet.OK_CANCEL
  )
  if(response.getSelectedButton() == ui.Button.OK) {
    const title = response.getResponseText().trim()
    // Create the section.
    const newSection = form.addSectionHeaderItem()
    newSection.setTitle(title)
    // Move it to the beginning.
    form.moveItem(form.getItemById(newSection.getId()), 0)
    Logger.log('Created signatures section titled %s', title)
    // Make it the chosen section.
    setSignaturesSectionTitle_(title)
  }
}

function getProperty_(key) {
  return PropertiesService.getDocumentProperties().getProperty(key)
}
function setProperty_(key, value) {
  return PropertiesService.getDocumentProperties().setProperty(key, value)
}

const SIGNATURES_SECTION_HEADER = 'SIGNATURES_SECTION_HEADER'
const NAME_SECTION_HEADER = 'NAME_SECTION_HEADER'
const CATEGORY_SECTION_HEADER = 'CATEGORY_SECTION_HEADER'

function getSignaturesSectionTitle_() {
  return getProperty_(SIGNATURES_SECTION_HEADER)
}
function setSignaturesSectionTitle_(value) {
  return setProperty_(SIGNATURES_SECTION_HEADER, value)
}
function getNameSectionTitle_() {
  return getProperty_(NAME_SECTION_HEADER)
}
function setNameSectionTitle_(value) {
  return setProperty_(NAME_SECTION_HEADER, value)
}
function getCategorySectionTitle_() {
  return getProperty_(CATEGORY_SECTION_HEADER)
}
function setCategorySectionTitle_(value) {
  return setProperty_(CATEGORY_SECTION_HEADER, value)
}
function clearCategorySectionTitle_() {
  return PropertiesService.getDocumentProperties().deleteProperty('CATEGORY_SECTION_HEADER')
}

function getSignaturesSection_() {
  return getSectionFromForm_(FormApp.ItemType.SECTION_HEADER, getSignaturesSectionTitle_())
}
function getNameSection_() {
  return getSectionFromForm_(FormApp.ItemType.TEXT, getNameSectionTitle_())
}
function getCategorySection_() {
  return getSectionFromForm_(FormApp.ItemType.TEXT, getCategorySectionTitle_())
}

/** Converts the given list into a string of text, containing the list items numbered and placed on separate lines. */
function getFormattedNumberedList_(list) {
  let text = ''
  for(let i = 0; i < list.length; i++) {
    text += `${i+1}. ${list[i]}\n`
  }
  return text
}

/** Gets a section from the form with the given item type and title. */
function getSectionFromForm_(itemType, itemTitle) {
  if(itemTitle === undefined) {
    return undefined
  }
  Logger.info('Looking for a form section with title %s and type %s', itemTitle, itemType)
  const form = FormApp.getActiveForm()
  const items = form.getItems(itemType)
  for(let i = 0; i < items.length; i++) {
    const title = items[i].getTitle()
    const match = title === itemTitle
    Logger.info('\tFound a section with title %s and type %s - %s', title, items[i].getType(), (match ? 'match' : 'not a match'))
    if(match) {
      return items[i]
    }
  }
  Logger.log('Could not find a form section with title %s and type %s', itemTitle, itemType)
  return undefined
}

/** Updates the description of the form with the latest list of signatures, in sorted order. */
function addSignaturesToForm() {
  const form = FormApp.getActiveForm()
  const signaturesSection = getSignaturesSection_()
  if(signaturesSection === undefined) {
    Logger.info('No signatures section was found. The form will not be changed.')
    return
  }
  const nameSection = getNameSection_()
  if(nameSection === undefined) {
    Logger.info('No name section was found. The form will not be changed.')
    return
  }
  const categorySection = getCategorySection_() // this is optional
  const DEFAULT_CATEGORY_NAME = 'none'

  Logger.info('Processing the existing form responses...')
  // Implementation note: for simplicity, this code looks up all responses each time it is run.
  // It does not attempt to work out which responses are new and which responses were already added to the signatures section.
  
  // Get the response data. This might be saved in a spreadsheet, but we can access them directly via the Form object.
  const formResponses = form.getResponses();
  // Group the signatures by category.
  const signaturesByCategory = {}
  for (let i = 0; i < formResponses.length; i++) {
    const formResponse = formResponses[i];
    const name = formResponse.getResponseForItem(nameSection).getResponse()
    const category = categorySection ? formResponse.getResponseForItem(categorySection).getResponse() : DEFAULT_CATEGORY_NAME
    // Create an empty list for the category if it doesn't already exist.
    if(!(signaturesByCategory.hasOwnProperty(category) && Array.isArray(signaturesByCategory[category]))) {
      signaturesByCategory[category] = []
    }
    // Add this name to the category.
    signaturesByCategory[category].push(name)
  }
  
  // Sort each list by name, number them, and add the categories as headings.
  let signatoriesText = ''
  for(let category of Object.keys(signaturesByCategory)) {
    const numberedList = getFormattedNumberedList_(signaturesByCategory[category].sort())
    const header = categorySection ? `${category} signatures\n\n` : ''
    signatoriesText += `\n${header}${numberedList}\n`
  }
  Logger.info('Processed the existing form responses.')
  
  // Update the form to show the list of signatures.
  Logger.info('Updating form with the list of signatures...')
  signaturesSection.setHelpText(signatoriesText)
  Logger.info('Form updated with the latest list of signatures.')
}
