from django.shortcuts import render
from django.template import *

from django.http import HttpResponse


def index1(request):
    return render(request, 'ppdisplay/index.html', {})


def index2(request):
    return render(request, 'ppdisplay/demo2.html', {})
