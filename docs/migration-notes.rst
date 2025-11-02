Juniper Migration Notes
--------------------------------

**cookies.html**
These are the default values and the variables that could be change:
"cookie_content":{
	"message":"This website uses cookies to ensure you get the best experience on our website.", "popup_colorbackground":"#323538",
	"popup_colortext":"#ffffff",
	"button_colorbackground":"#005379",
	"button_colortext":"#ffffff",
	"message_button":"Got it!",
	"message_link":"Learn more",
	"link_href":"http://cookiesandyou.com"
}

**header**
the header folder needs all the templates if not will give an error.

**login.html - register.html**
These templates were removed in this version of the platform, do not use.

**main.html, dashboard.html, index.html, courseware/courses.html**
These are the common templates that fails, copy the content of the new version and add the custom changes.

**static_content.html**
The path of the original file: common/djangoapps/pipeline_mako/templates/static_content.html

**Custom templates won't find in edx-platform**

**custom_colors.html**
This template overrides the styles of the platform to different sections, the overrides values comes from site settings. These have to be tested because sometimes the css specificity doesn't work well.

**head-extra.html**
This templates loads the css override file and the styles overrides inline extra

**google_analytics.html**
Add google analytics and tag manager code with the info of site configuration

**lang_selector.html**
Contains the code to add language selector in header and footer.

**eox-tenant/not_found.html**
Add not found page.

**Bragi children**

Actives sites:
- Dimagi
- Politecnico
- Suss (awwa-unilearn, suss-ipa, suss-raise: different register page)

Lilac Migration Notes
--------------------------------

Added: fix: login redirection https://bitbucket.org/edunext/ednx-saas-themes/pull-requests/102/
