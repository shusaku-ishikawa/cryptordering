import json
import os
from datetime import datetime
import time
import python_bitbankcc
from django.core.management.base import BaseCommand
from django.template.loader import get_template

from .models import Order, Order, User



# BaseCommandを継承して作成
logger = logging.getLogger('batch_logger')

def notify_user(user, order_obj):
