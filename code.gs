/**
 * @OnlyCurrentDoc
 * Ensures that this script only requests permission for the form that uses it,
 * and not any other Google Drive files.
 */

// This should match the title of a 'title and description' section in the form, with an empty description.
// The list of signatures will be placed under this heading.
const SIGNATURES_SECTION_HEADER = 'Signatures'
// This should match the title of the form question that asks for a name/signature.
const NAME_SECTION_HEADER = 'Name'
// This should match the title of the form question that asks for a category, e.g. Individual or Department.
const CATEGORY_SECTION_HEADER = 'Category'

/** Converts the given list into a string of text, containing the list items numbered and placed on separate lines. */
function getFormattedNumberedList_(list) {
  let text = ''
  for(let i = 0; i < list.length; i++) {
    text += `${i+1}. ${list[i]}\n`
  }
  return text
}

/** Gets a section from the form with the given item type and title. */
function getSectionFromForm_(form, itemType, itemTitle) {
  Logger.info('Looking for a form section with title %s and type %s', itemTitle, itemType)
  const items = form.getItems(itemType)
  for(let i = 0; i < items.length; i++) {
    const title = items[i].getTitle()
    const match = title === itemTitle
    Logger.info('Found a section with title %s and type %s - %s', title, items[i].getType(), (match ? 'match' : 'not a match'))
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
  const signaturesSection = getSectionFromForm_(form, FormApp.ItemType.SECTION_HEADER, SIGNATURES_SECTION_HEADER)
  if(signaturesSection === undefined) {
    Logger.info('No signatures section was found. The form will not be changed.')
    return
  }
  const nameSection = getSectionFromForm_(form, FormApp.ItemType.TEXT, NAME_SECTION_HEADER)
  const categorySection = getSectionFromForm_(form, FormApp.ItemType.TEXT, CATEGORY_SECTION_HEADER)
  
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
    const category = formResponse.getResponseForItem(categorySection).getResponse()
    // Create an empty list for the category if it doesn't already exist.
    if(!(signaturesByCategory.hasOwnProperty(category) && Array.isArray(signaturesByCategory[category]))) {
      signaturesByCategory[category] = []
      }
    signaturesByCategory[category].push(name)
    }
  
  // Sort each list by name, number them, and add the categories as headings.
  let signatoriesText = ''
  for(let category of Object.keys(signaturesByCategory)) {
    const numberedList = getFormattedNumberedList_(signaturesByCategory[category].sort())
    signatoriesText += `\n${category} signatures\n\n${numberedList}\n`
  }
  Logger.info('Processed the existing form responses.')
  
  // Update the form to show the list of signatures.
  Logger.info('Updating form with the list of signatures...')
  signaturesSection.setHelpText(signatoriesText)
  Logger.info('Form updated with the latest list of signatures.')
}
