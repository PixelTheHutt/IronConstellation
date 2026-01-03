from django.shortcuts import render

# Create your views here.
# Views are Python functions that take a web request and return a web response.

def index(request):
    """
    This view handles the homepage.
    It simply renders the 'index.html' template file.
    
    Parameters:
    - request: The incoming HTTP request from the user's browser.
    """
    return render(request, 'game/index.html')