from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils.translation import ugettext_lazy as _
from core.models import *
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.core.mail import send_mail
from django.conf import settings
from django.utils.safestring import mark_safe
from core.enums import *

class MyUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = '__all__'


class MyUserCreationForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('email',)


class MyUserAdmin(UserAdmin):
    fieldsets = (
        (None, {'fields': ('full_name', 'remaining_days','email', 'password')}),
        (_('Personal info'), {'fields': ('bb_api_key', 'bb_api_secret_key', 'cc_api_key', 'cc_api_secret_key', 'notify_if_filled', 'email_for_notice')}),
        (_('Permissions'), {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('full_name', 'email', 'password1', 'password2'),
        }),
    )
    form = MyUserChangeForm
    add_form = MyUserCreationForm
    list_display = ('full_name', 'remaining_days', 'email',  'is_active', 'is_staff', 'date_joined',)
    list_filter = ('remaining_days', 'is_staff', 'is_active')
    search_fields = ('email','full_name')

    ordering = ('remaining_days',)

    def mail_users(self, request, queryset):
        print(request.POST)
        if 'apply' in request.POST:
            subj = request.POST.get('subject')
            msg = request.POST.get('message')
            send_mail(
                subj,
                msg,
                settings.DEFAULT_FROM_EMAIL,
                queryset.values_list('email_for_notice', flat = True)
            )
            self.message_user(request, "{} ユーザにメールを送信しました。".format(queryset.count()))
            return HttpResponseRedirect(request.get_full_path())
       
        return render(request,'bitbank/mail_users.html',context={'users': queryset})

    mail_users.short_description = '一括メール送信'

    actions = [mail_users]
    
class MyRelationAdmin(admin.ModelAdmin):
    list_display = ('pk', 'market', 'user_display', 'pair_display', 'special_order', 'order_1', 'order_2', 'order_3', 'placed_at', 'is_active')
    list_display_links = ('pk',)
    def pair_display(self, obj):
        return PAIRS[obj.pair]
    def order_type_display(self, obj):
        return ORDER_TYPES[obj.order_type]
    def user_display(self, obj):
        return obj.user.full_name
    user_display.short_description = '利用者'
    pair_display.short_description = '通貨'
    order_type_display.short_description = '注文'
    
class MyOrderAdmin(admin.ModelAdmin):
    list_display = ('market', 'order_id', 'user_display', 'pair_display', 'side_display', 'order_type_display', 'price', 'start_amount', 'remaining_amount', 'executed_amount', 'status_display', 'error_message')
    list_display_links = ('order_id',)
    def user_display(self, obj):
        return obj.user.full_name
    user_display.short_description = '利用者'
    def pair_display(self, obj):
        return PAIRS[obj.pair]
    def side_display(self, obj):
        return '買' if obj.side == SIDE_BUY else '売'
    def order_type_display(self, obj):
        return ORDER_TYPES[obj.order_type]
    def status_display(self, obj):
        if obj.status == None:
            return '未注文'
        else:
            return STATUS[obj.status]
        
    pair_display.short_description = '通貨'
    side_display.short_description = '売/買'
    order_type_display.short_description = '注文'
    status_display.short_description = 'ステータス'
    
    
class MyAlertAdmin(admin.ModelAdmin):
    list_display = ('market', 'user_display', 'pair_display', 'rate', 'is_active')
    def pair_display(self, obj):
        return PAIRS[obj.pair]
    def user_display(self, obj):
        return obj.user.full_name
    user_display.short_description = '利用者'
    pair_display.short_description = '通貨'

class MyInquiryAdmin(admin.ModelAdmin):
    
    list_display = ('user_display', 'date_initiated', 'subject', 'body', 'email_for_reply', 'show_attachment_1', 'show_attachment_2', 'show_attachment_3')
    def user_display(self, obj):
        return obj.user.full_name
    user_display.short_description = '利用者'

    def show_attachment_1(self, obj):
        if obj.attachment_1:
            return mark_safe('<img src="{url}" width="{width}" height={height} />'.format(
                url = obj.attachment_1.file.url,
                width = "100px",
                height= "auto",
                )
            )
        else:
            return 'なし'
    
    def show_attachment_2(self, obj):
        if obj.attachment_2:
            return mark_safe('<img src="{url}" width="{width}" height={height} />'.format(
                url = obj.attachment_2.file.url,
                width = "100px",
                height= "auto",
                )
            )
        else:
            return 'なし'
    def show_attachment_3(self, obj):
        if obj.attachment_2:
            return mark_safe('<img src="{url}" width="{width}" height={height} />'.format(
                url = obj.attachment_3.file.url,
                width = "100px",
                height= "auto",
                )
            )
        else:
            return 'なし'
    show_attachment_1.short_description = '添付ファイル１'
    show_attachment_2.short_description = '添付ファイル２'
    show_attachment_3.short_description = '添付ファイル３'

class MyBankInfoAdmin(admin.ModelAdmin):
    list_display = ('bank', 'branch', 'meigi','type', 'number')
    # def has_add_permission(self, request, obj=None):
    #     return False


class MyAdminSite(admin.AdminSite):
    site_header = 'bitbank-order.com'
    site_title  = 'サイト管理'
    index_title = '管理サイト'
    def get_app_list(self, request):
        """
        Return a sorted list of all the installed apps that have been
        registered in this site.
        """
        ordering = {
            "1.利用者": 1,
            "5.問い合せ": 5,
            "3.取引履歴": 3,
            "2.発注一覧": 2,
            "4.通知設定":4,
            '6.口座情報':6,
        }
        app_dict = self._build_app_dict(request)
        
        app_list = sorted(app_dict.values(), key=lambda x: x['name'].lower())

        for app in app_list:
            app['models'].sort(key=lambda x: ordering[x['name']])

        return app_list

admin_site = MyAdminSite(name = '取引所')
admin_site.register(User, MyUserAdmin)
admin_site.register(Relation, MyRelationAdmin)
admin_site.register(Order, MyOrderAdmin)
admin_site.register(Alert, MyAlertAdmin)
admin_site.register(Inquiry, MyInquiryAdmin)
admin_site.register(BankInfo, MyBankInfoAdmin)