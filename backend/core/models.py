import logging
import json
from datetime import datetime, timedelta
from django import forms
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.core.mail import send_mail
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from unixtimestampfield.fields import UnixTimeStampField
from django.core.files.storage import FileSystemStorage
from django.db.models.signals import post_delete
from django.dispatch import receiver
import unicodedata
from django.db.models import Q
from datetime import datetime
import time
from django.template.loader import get_template
from django.utils import timezone
from django.template.loader import get_template
from django.conf import settings
from core.myexception import *
from core.enums import *
import ccxt


def parse_ccxt_error(market, orig):
    import re, json
    if market == MARKET_BITBANK:
        matched = re.findall(r'\{.+\}', orig)
        if len(matched) > 0:
            parsed = json.loads(matched[0])
            code = parsed.get('data').get('code')
            return BITBANK_ERROR_CODES[str(code)]
        else:
            return ['']

class ASCIIFileSystemStorage(FileSystemStorage):
    """
    Convert unicode characters in name to ASCII characters.
    """
    def get_valid_name(self, name):
        name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore')
        return super(ASCIIFileSystemStorage, self).get_valid_name(name)

class UserManager(BaseUserManager):
    """ユーザーマネージャー."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        """メールアドレスでの登録を必須にする"""
        if not email:
            raise ValueError('The given email must be set')
        email = self.normalize_email(email)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """is_staff(管理サイトにログインできるか)と、is_superuer(全ての権限)をFalseに"""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """スーパーユーザーは、is_staffとis_superuserをTrueに"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(email, password, **extra_fields)



class User(AbstractBaseUser, PermissionsMixin):
    def __str__(self):
        if self.full_name == None:
            return 'no name'
        else:
            return self.full_name
        
    email = models.EmailField(_('登録メールアドレス'), unique=True)
    email_for_notice = models.EmailField(_('通知用メールアドレス'), blank=False, null = False)
    full_name = models.CharField(_('名前'), max_length=150, blank=True, null = True)
    bb_api_key = models.CharField(_('bitbank API KEY'), max_length=255, blank=True, null = True)
    bb_api_secret_key = models.CharField(_('bitbank API SECRET KEY'), max_length=255, blank=True, null = True)
    cc_api_key = models.CharField(_('coincheck API KEY'), max_length=255, blank=True, null = True)
    cc_api_secret_key = models.CharField(_('coincheck API SECRET KEY'), max_length=255, blank=True, null = True)
    
    notify_if_filled = models.BooleanField(
        verbose_name = _('約定通知'),
        default = True
    )
    use_alert = models.BooleanField(
        verbose_name = _('アラートメール通知'),
        default = True
    )

    is_staff = models.BooleanField(
        _('管理者'),
        default=False,
        help_text=_(
            'Designates whether the user can log into this admin site.'),
    )
    is_active = models.BooleanField(
        _('利用開始'),
        default=True,
        help_text=_(
            'Designates whether this user should be treated as active. '
            'Unselect this instead of deleting accounts.'
        ),
    )

    remaining_days = models.IntegerField(
        _('残日数'),
        blank = True,
        default = 0,
        validators = [
                MinValueValidator(0),
        ]
    )
    date_joined = models.DateTimeField(_('date joined'), default=timezone.now)

    objects = UserManager()

    EMAIL_FIELD = 'email'
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = _('利用者')
        verbose_name_plural = _('1.利用者')

    def email_user(self, subject, message, from_email=None, **kwargs):
        """Send an email to this user."""
        send_mail(
            subject,
            message,
            from_email,
            [self.email_for_notice],
            **kwargs
        )

 

    @property
    def username(self):
        """username属性のゲッター

        他アプリケーションが、username属性にアクセスした場合に備えて定義
        メールアドレスを返す
        """
        return self.email
    def fetch_balance(self, market, asset_name = None):
        client_class = getattr(ccxt, market)
        client = client_class({
            'nonce': ccxt.Exchange.milliseconds,
        })
        if market == MARKET_BITBANK:
            client.apiKey = self.bb_api_key
            client.secret = self.bb_api_secret_key
        elif market == MARKET_COINCHECK:
            client.apiKey = self.cc_api_key
            client.secret = self.cc_api_secret_key
        try:
            free = client.fetch_balance().get('free')
        except:
            return None
        else:
            if asset_name:
                return free.get(asset_name)
            else:
                return free
logger = logging.getLogger('batch_logger')

import re
def _trim_error_msg(msg):
    return re.sub('エラーコード: [0-9]+ 内容: ',"", msg)

class Order(models.Model):
    def __str__(self):
        if self.id == None:
            return "-"
        else:
            return self.id
        
    class Meta:
        verbose_name = "取引履歴"
        verbose_name_plural = "3.取引履歴"

    auto_id = models.AutoField(
        primary_key = True
    )
    user = models.ForeignKey(
        User,
        verbose_name = '利用者',
        on_delete = models.CASCADE
    )

    market = models.CharField(
        verbose_name = _('取引所'),
        max_length = 50,
    )
   
    symbol = models.CharField(
        verbose_name = _('通貨'),
        max_length = 50,
    )

    side = models.CharField(
        verbose_name = '売/買',
        max_length = 50,
    )

    type = models.CharField(
        verbose_name = _('注文方法'),
        max_length = 50,
    )

    price = models.FloatField(
        verbose_name = _('注文価格'),
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0),
        ]
    )
    stop_price = models.FloatField(
        verbose_name = _('ストップ価格'),
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0),
        ]
    )

    trail_width = models.FloatField(
        verbose_name = 'トレール幅',
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0)
        ]
    )
    trail_price = models.FloatField(
        verbose_name = 'トレール金額',
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0.0)
        ]
    )

    amount = models.FloatField(
        verbose_name = _('注文数量'),
        null = True,
        validators = [
            MinValueValidator(0.0),
        ]
    )

    remaining = models.FloatField(
        verbose_name = _('未約定数量'),
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0.0)
        ]
    )

    filled = models.FloatField(
        verbose_name = _('約定済数量'),
        blank = True,
        null = True,
        validators = [
            MinValueValidator(0.0)
        ]
    )

    average = models.FloatField(
        verbose_name = _('約定平均価格'),
        null = True,
        blank = True,
        validators = [
            MinValueValidator(0.0)
        ]
    )

    status = models.CharField(
        verbose_name = _('ステータス'),
        null = True,
        max_length = 50,
    )
    error_message = models.CharField(
        verbose_name = 'エラー内容',
        max_length = 50,
        default = None,
        null = True,
        blank = True
    )
    id = models.CharField(
        verbose_name = _('取引ID'),
        max_length = 50,
        null = True,
        blank = True
    )

    timestamp = UnixTimeStampField(
        verbose_name = _('注文時刻unixtime'),
        use_numeric = True,
        null = True,
        auto_now_add = False,
        auto_now = False,
        blank = True
    )

    updated_at = UnixTimeStampField(
        verbose_name = _('更新日時unixtimestamp'), 
        use_numeric = True,  
        auto_now = True,
    )
    
    @property
    def myposition(self):
        if hasattr(self, POSITION_NEW_ORDER):
            return POSITION_NEW_ORDER
        elif hasattr(self, POSITION_SETTLE_ORDER_1):
            return POSITION_SETTLE_ORDER_1
        elif hasattr(self, POSITION_SETTLE_ORDER_2):
            return POSITION_SETTLE_ORDER_2
        else:
            raise Exception('')
    
    @property
    def is_immediate_order(self):
        return self.type in { TYPE_MARKET, TYPE_LIMIT }
    @property
    def is_limit_order(self):
        return 'limit' in self.type
    @property
    def is_stop_order(self):
        return 'stop' in self.type
    @property
    def is_trail_order(self):
        return 'trail' in self.type
    
    @property
    def valid_order_type(self):
        if self.is_stop_order:
            return self.type.split('_')[1]
        elif self.is_trail_order:
            return TYPE_MARKET
        else:
            return self.type

    def is_placable(self, rate):
        if self.is_stop_order:
            return (self.side == SIDE_SELL and (rate <= self.stop_price)) or \
                (self.side == SIDE_BUY and (rate >= self.stop_price))
        elif self.is_trail_order:
            if self.side == SIDE_SELL:
                if self.trail_price > rate:
                    return True       
                elif rate > self.trail_price + self.trail_width:
                    self.trail_price = rate - self.trail_width
                    self.save()
                    return False
            else:
                if self.trail_price <= rate:
                    return True
                elif rate <= self.trail_price - self.trail_width:
                    self.trail_price = rate + self.trail_width
                    self.save()
                    return False

    def place(self, force = False):
        logger = logging.getLogger('api')
        if self.status != STATUS_READY_TO_ORDER:
            return True
        
        if not force and not self.is_immediate_order:
            return True
    
        client_class = getattr(ccxt, self.market)
        client = client_class({
            'nonce': ccxt.Exchange.milliseconds
        })
        
        if self.market == MARKET_BITBANK:
            client.apiKey = self.user.bb_api_key
            client.secret = self.user.bb_api_secret_key
        elif self.market == MARKET_COINCHECK:
            client.apiKey = self.user.cc_api_key
            client.secret = self.user.cc_api_secret_key
        try:
            result = client.create_order(self.symbol, self.valid_order_type, self.side, self.amount, self.price)
        except Exception as e:
            print(e)
            self.status = STATUS_FAILED_TO_ORDER
            self.error_message = parse_ccxt_error(self.market, e.args[0])
            
        else:
            print(result)
            
            self.id = result.get('id')
            self.status = result.get('status')
            self.amount = result.get('amount')
            self.remaining = result.get('remaining')
            self.timestamp = result.get('timestamp')
        finally:
            self.save()
            return self.status != STATUS_FAILED_TO_ORDER

    def cancel(self):
        # 未約定、部分約定以外のステータスの倍はステータスのみ変更
        if self.status not in { STATUS_UNFILLED, STATUS_PARTIALLY_FILLED }:
            self.status = STATUS_CANCELED_UNFILLED
            self.save()
            return True

        client_class = getattr(ccxt, self.market)
        client = client_class({
            'nonce': ccxt.Exchange.milliseconds
        })
        
        if self.market == MARKET_BITBANK:
            client.apiKey = self.user.bb_api_key
            client.secret = self.user.bb_api_secret_key
        elif self.market == MARKET_COINCHECK:
            client.apiKey = self.user.cc_api_key
            client.secret = self.user.cc_api_secret_key
        try:
            result = client.cancel_order(self.id, self.symbol)
        except Exception as e:
            return False
        else:
            print(result)
            return True
            
    def update(self):
        logger  = logging.getLogger('api')
    
       # 未約定、部分約定以外のステータスの倍はステータスのみ変更
        if self.status not in { STATUS_UNFILLED, STATUS_PARTIALLY_FILLED }:
            self.status = STATUS_CANCELED_UNFILLED
            self.save()
            return True

        client_class = getattr(ccxt, self.market)
        client = client_class({
            'nonce': ccxt.Exchange.milliseconds
        })
        
        if self.market == MARKET_BITBANK:
            client.apiKey = self.user.bb_api_key
            client.secret = self.user.bb_api_secret_key
        elif self.market == MARKET_COINCHECK:
            client.apiKey = self.user.cc_api_key
            client.secret = self.user.cc_api_secret_key
        try:
            order = client.fetch_order(self.id, self.symbol)
        except Exception as e:
            print(e)
            return False
        else:
            self.status = order.get('status')
            self.remaining = order.get('remaining')
            self.filled = order.get('filled')
            self.average = order.get('average')
            self.save()
            return True
    
    def notify_user(self):
        try:
            readable_datetime = datetime.fromtimestamp(int(self.timestamp / 1000))
        except ValueError as e:
            print(e)
            return False
        else:
            context = { "user": self.user, "order": self, 'readable_datetime': readable_datetime }
            subject = get_template('mail_template/fill_notice/subject.txt').render(context)
            message_txt = get_template('mail_template/fill_notice/message.txt').render(context)
            message_html = get_template('mail_template/fill_notice/message.html').render(context)
            
            self.user.email_user(subject, message_txt, settings.DEFAULT_FROM_EMAIL, html_message = message_html)
            logger.info('notice sent to:' + self.user.email_for_notice)

class Relation(models.Model):
    def __str__(self):
        return self.special_order

    class Meta:
        verbose_name = "発注一覧"
        verbose_name_plural = "2.発注一覧"

    
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    market = models.CharField(
        verbose_name = _('取引所'),
        max_length = 50,
        default = 'bitbank'
    )
    
    symbol = models.CharField(
        verbose_name = _('通貨'),
        max_length = 50,
    )
    
    special_order = models.CharField(
        verbose_name = _('特殊注文'), 
        max_length = 50,
    )

    order_1 = models.OneToOneField(
        Order,
        verbose_name = '新規注文',
        related_name = 'new_order',
        null = True,
        blank = True,
        on_delete = models.CASCADE
    )
    order_2 = models.OneToOneField(
        Order,
        verbose_name = '決済注文1',
        related_name = 'settle_order_1',
        null = True,
        blank = True,
        on_delete = models.CASCADE
    )
    order_3 = models.OneToOneField(
        Order,
        verbose_name = '決済注文2',
        related_name = 'settle_order_2',
        null = True,
        blank = True,
        on_delete = models.CASCADE
    )
    placed_at = models.DateTimeField(
        verbose_name = '注文日時',
        auto_now_add = True
    )
    is_locked = models.BooleanField(
        verbose_name = 'ロック中',
        default = False
    )
    is_active = models.BooleanField(
        verbose_name = '有効',
        default = True,
    )
    @property
    def errors(self):
        errors = []
        if self.order_1 and self.order_1.status == STATUS_FAILED_TO_ORDER:
            errors.append('新規注文でエラー:{}'.format(self.order_1.error_message))
        if self.order_2 and self.order_2.status == STATUS_FAILED_TO_ORDER:
            errors.append('決済注文1でエラー:{}'.format(self.order_2.error_message))
        if self.order_3 and self.order_3.status == STATUS_FAILED_TO_ORDER:
            errors.append('決済注文2でエラー:{}'.format(self.order_3.error_message))
        return errors
   

class Alert(models.Model):
    def __str__(self):
        return self.symbol

    class Meta:
        verbose_name = "通知設定"
        verbose_name_plural = "4.通知設定"
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    market = models.CharField(
        verbose_name = '取引所',
        max_length = 50,
        default = 'bitbank'
    )
    symbol = models.CharField(
        verbose_name = _('通貨'),
        max_length = 50,
        default = 'btc_jpy',
    )

    rate = models.FloatField(
        verbose_name = _('通知レート'),
        null = False,
        validators = [
            MinValueValidator(0),
        ]
    )

    over_or_under = models.CharField(
        verbose_name = _('上下'),
        max_length = 50,
        null = False,
    )

    alerted_at = models.DateTimeField(
        verbose_name = _('通知日時'),   
        auto_now = False,
        null = True
    )
    comment = models.CharField(
        verbose_name = 'コメント',
        max_length = 255,
        blank = True,
        default = ""
    )

    is_active = models.BooleanField(
        verbose_name = _('有効'),
        null = True,
    )
    def notify_user(self):
        if self.user.use_alert:
            context = { "user": self.user, "rate": self.rate, "symbol": self.symbol, "comment": self.comment }
            subject = get_template('mail_template/rate_notice/subject.txt').render(context)
            message_txt = get_template('mail_template/rate_notice/message.txt').render(context)
            message_html = get_template('mail_template/rate_notice/message.html').render(context)
        
            self.user.email_user(subject, message_txt, settings.DEFAULT_FROM_EMAIL, html_message = message_html)
            self.alerted_at = timezone.now()
            
        self.is_active = False
        self.save()
    
        
class Inquiry(models.Model):
    def __str__(self):
        return self.subject
    class Meta:
        verbose_name = "問い合せ"
        verbose_name_plural = "5.問い合せ"

    user = models.ForeignKey(User, on_delete=models.CASCADE)

    subject = models.CharField(
        verbose_name = _('件名'),
        max_length = 255,
    )
    body = models.CharField(
        verbose_name = _('内容'),
        max_length = 255,
    )
    email_for_reply = models.EmailField(
        verbose_name = _('通知用メールアドレス'),
    )
   
    attachment_1 = models.FileField(
        verbose_name = 'ファイル1',
        upload_to = 'attachments',
        null = True,
        blank = True,
    )
    attachment_2 = models.FileField(
        verbose_name = 'ファイル2',
        upload_to = 'attachments',
        null = True,
        blank = True,
    )
    attachment_3 = models.FileField(
        verbose_name = 'ファイル3',
        upload_to = 'attachments',
        null = True,
        blank = True,
    )

    closed = models.BooleanField(
        _('解決済'),
        default=False,
    )
    date_initiated = models.DateTimeField(
        verbose_name = '問い合せ日時',
        auto_now_add = True,

    )

class Ticker():
    @staticmethod
    def get_ticker(market, symbol):
        client_class = getattr(ccxt, market)
        client = client_class()
        try:
            data = client.fetch_ticker(symbol)
        except Exception as e:
            return None
        else:
            return data
class BankInfo(models.Model):
    def __str__(self):
        return '口座情報'
    class Meta:
        verbose_name = "口座情報"
        verbose_name_plural = "6.口座情報"
    
    types = [
        ('普通', '普通'),
        ('当座', '当座')
    ]
    bank = models.CharField(
        verbose_name = '金融機関名',
        max_length = 20,
        default = 'xxx銀行',
        blank = False,
        null = False
    )
    branch = models.CharField(
        verbose_name = '支店名',
        max_length = 20,
        default = 'xxx支店',
        blank = False,
        null = False
    )
    meigi = models.CharField(
        verbose_name = '口座名義人',
        max_length = 50,
        default = 'xxxxx'
    )
    type = models.CharField(
        verbose_name = '口座種別',
        max_length = 20,
        choices = types,
        default = '普通'
    )
    number = models.CharField(
        verbose_name = '口座番号',
        max_length = 20,
        default = '00000',
        null = False,
        blank = False
    )


    @staticmethod
    def get_bank_info():
        qs = BankInfo.objects.all()
        if len(qs) == 0:
            instance = BankInfo()
            BankInfo.bank = 'no data'
            BankInfo.branch = 'no data'
            BankInfo.meigi = 'no data'
            BankInfo.type = '普通'
            BankInfo.number = 'no data'
            return instance
        return qs[0]
