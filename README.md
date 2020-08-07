# form-signatures
This is a simple application that extends the capabilities of a Google Form, by displaying the full list of responses within the form itself.
This can be used for forms and surveys where the list of signatures is intended to be made public.

When using this tool, please be sure to confirm that your participants are willing to have their signature displayed to all others who access the form.

This project is written in Google Apps Script (a variation of JavaScript) and HTML.

## Instructions
1. Create a new Google Form, and add the questions you want to ask participants.
1. Your form must have at least one 'Short answer' section that collects the name/signature from the participant.
1. When editing the form, click the **More** menu (three vertical dots in the top-right corner), and then click **Script editor**. This will create an Apps Script project associated with your form. Give it a name of your choice -- this can be the same name as your form.
1. Copy the contents of [`code.gs`](code.gs) from this project, and paste it into the `Code.gs` file in the Script editor.
1. In the Script editor, click **File > New > HTML file**, then name the file `sidebar.html`.
1. Copy the contents of [`sidebar.html`](sidebar.html) from this project, and paste it into the `sidebar.html` file in the Script editor.
1. Save both files, return to the form editor, and refresh the page.
1. A new menu button will appear in the top right, with a puzzle piece icon and the title **Add-ons**. Click this menu, and then click **Configure form signatures**.
1. In the popup dialog that appears, click **Set up**.
    1. The first time you do this, Google will ask you for two permissions to run the application: to access the current form, and to create web components in the user interface of the form editor.
    1. In the dialog box that appears, click on your Google Account, then click **Advanced**, and authorize the project to run.
    1. This application is designed to access only the Google Form that it is attached to, and no other documents in your Google Account. Please read over the code from this project and confirm you are happy to run it on your form.
    1. Once you have granted permission, click **Set up** again from the same menu.
1. A sidebar named **Configure form signatures** will appear, which will ask you some questions about the form:
    - _Which section asks participants for their name?_ This is needed to read the signatures from the list of responses.
    - _Which section asks participants for their category/affiliation?_ If provided, signatures will be grouped by category. Choose `None` if you do not want them grouped.
    - _Which section should show the full list of signatures?_ This should be a `title and description` section of the form. The description should be left blank -- it will be filled in with the list of responses.
    - If you haven't got a signatures section already, click the link saying `Click here to create one`.
1. Click **Submit choices and update form** when you are ready.
    - You can click this every time you want to manually update the list of signatures.
1. Finally, set up an automatic trigger to run the script on a regular basis.
    1. Go back to the Script editor, click **Edit > Current project's triggers**, and click **Add trigger**.
    1. Under **Choose function to run**, select `addSignaturesToForm` from the dropdown.
    1. Under **Select event source**, select `Time-driven` from the dropdown.
    1. Under **Select type of time based trigger** and **Select hour interval**, select the frequency with which you want the list of signatures to be updated.
    1. Click **Save**.
1. You're ready to go! Watch your form responses get collected into the signatures section.


## License

This project is licensed under the [MIT License](LICENSE).
