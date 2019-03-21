import json
import logging
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
    readable_datetime = datetime.fromtimestamp(int(int(order_obj.ordered_at) / 1000))
    context = { "user": user, "order": order_obj, 'readable_datetime': readable_datetime }
    subject = get_template('bitbank/mail_template/fill_notice/subject.txt').render(context)
    message = get_template('bitbank/mail_template/fill_notice/message.txt').render(context)
    user.email_user(subject, message)
    logger.info('notice sent to:' + user.email_for_notice)

