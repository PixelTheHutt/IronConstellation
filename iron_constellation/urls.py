"""
URL configuration for iron_constellation project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

# We need to import the views from our game app so we can link to them.
from game import views

urlpatterns = [
    # The Admin panel route (already existed)
    path('admin/', admin.site.urls),

    # This is the route for the homepage.
    # The empty string '' represents the root of the website (e.g., ironconstellation.com/).
    # It calls the 'index' function inside our views file.
    path('', views.index, name='index'),
]