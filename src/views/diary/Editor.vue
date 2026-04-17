<template>
  <div class="d-flex flex-column ga-6">
    <v-card rounded="xl" border>
      <v-card-text class="pa-7">
        <div class="d-flex align-center flex-wrap ga-3 mb-4">
          <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">返回</v-btn>
          <v-spacer />
          <v-chip :color="currentStatus === 'draft' ? 'warning' : 'success'" variant="tonal">
            {{ currentStatus === 'draft' ? '草稿' : '已发布' }}
          </v-chip>
        </div>

        <v-progress-linear v-if="loading" indeterminate color="primary" rounded class="mb-6" />

        <div class="d-flex flex-column ga-4 mb-5">
          
          <div class="d-flex flex-wrap ga-2">
            <v-chip color="secondary" variant="tonal">{{ visibilityText(form.visibility) }}</v-chip>
            <v-chip v-if="form.weather" variant="tonal">天气 {{ form.weather }}</v-chip>
            <v-chip v-if="form.mood" variant="tonal">心情 {{ form.mood }}</v-chip>
          </div>

          <div class="d-flex flex-wrap ga-4 text-caption text-medium-emphasis">
            <span>创建时间：{{ formatDate(meta.created_at) }}</span>
            <span>最近更新：{{ formatDate(meta.updated_at || meta.created_at) }}</span>
            <span>发布时间：{{ formatDate(meta.published_at) }}</span>
          </div>
        </div>

        <v-text-field v-model="form.title" clearable label="标题" maxlength="255" variant="outlined" />

        <v-textarea
          v-model="form.content"
          auto-grow
          clearable
          counter="5000"
          label="正文"
          rows="12"
          variant="outlined"
        />

        <v-row>
          <v-col cols="12" md="6">
            <v-select v-model="form.visibility" :items="VISIBILITY_OPTIONS" :disabled="isFireflyMode" label="可见性" variant="outlined" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="form.weather" :items="WEATHER_OPTIONS" clearable label="天气" variant="outlined" />
          </v-col>

          <v-col cols="12" md="6">
            <v-select v-model="form.mood" :items="MOOD_OPTIONS" clearable label="心情" variant="outlined" />
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field v-model="form.topic_id" clearable label="话题 ID" type="number" variant="outlined" />
          </v-col>
        </v-row>

        <v-alert class="mt-2" type="info" variant="tonal" rounded="xl">
          支持 JPEG/PNG/GIF/HEIC/HEIF，单张不超过 10MB，最多上传9张。
        </v-alert>

        <div class="mb-4 mt-3">
          <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-1">
            <div class="text-subtitle-2 font-weight-medium">上传照片（{{ totalImageCount }}/9）</div>
            <div class="text-caption text-medium-emphasis">支持 JPEG/PNG/GIF/HEIC/HEIF，单张不超过 10MB</div>
          </div>

          <input
            ref="photoInput"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/heic,image/heif"
            multiple
            class="d-none"
            @change="onPhotoChange"
          />

          <div class="d-flex flex-wrap ga-3">
            <v-sheet
              v-for="(url, index) in imagePreviewUrls"
              :key="`${url}-${index}`"
              border
              rounded
              width="96"
              height="96"
              style="position: relative; overflow: hidden;"
            >
              <v-img :src="url" cover width="96" height="96">
                <template #error>
                  <div class="d-flex align-center justify-center fill-height text-caption text-medium-emphasis">
                    加载失败
                  </div>
                </template>
              </v-img>
              <v-btn
                icon
                size="x-small"
                color="error"
                style="position: absolute; top: 4px; right: 4px;"
                @click="removeImage(index)"
              >
                <v-icon size="14">mdi-close</v-icon>
              </v-btn>
            </v-sheet>

            <v-btn
              v-if="totalImageCount < MAX_IMAGE_COUNT"
              variant="outlined"
              style="width: 96px; height: 96px;"
              class="d-flex flex-column ga-1"
              @click="openPhotoPicker"
            >
              <v-icon size="22">mdi-camera-plus-outline</v-icon>
              <span>添加</span>
            </v-btn>
          </div>

          <div v-if="uploadingPhotos" class="mt-3">
            <div class="d-flex justify-space-between text-caption text-medium-emphasis mb-1">
              <span>图片上传中</span>
              <span>{{ uploadCompletedCount }}/{{ uploadTotalCount }}</span>
            </div>
            <v-progress-linear
              indeterminate
              color="primary"
            />
          </div>
        </div>

        <div class="mt-4 d-flex align-center">
          <v-checkbox
            v-model="fireflyCovenantAgreed"
            hide-details
            class="mr-2"
          />
          <span class="text-body-2">我已知晓并同意</span>
          <v-btn
            variant="text"
            size="small"
            class="pa-0 ml-1 text-primary"
            style="min-height: auto; height: auto;"
            @click="openCovenantDialog"
          >
            《萤火集社区公约》
          </v-btn>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="allowDraftAction"
          prepend-icon="mdi-content-save-outline"
          :loading="submitting"
          variant="tonal"
          @click="saveDraft"
        >
          保存草稿
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-send-outline"
          :loading="submitting"
          :disabled="form.visibility === 'public' && !fireflyCovenantAgreed"
          @click="handlePrimaryAction"
        >
          {{ primaryActionText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>

  <v-dialog v-model="fireflyCovenantDialog" max-width="640" persistent scrollable>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center">
        《半页纸·萤火集社区公约》
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" @click="closeCovenantDialog" />
      </v-card-title>

      <v-card-text class="pa-7" style="max-height: 60vh; overflow-y: auto;">
        <div class="covenant-content">
          <h3 style="font-size: 1.1em; font-weight: bold; margin: 0 0 1em 0;">序言</h3>
          <p>欢迎来到"半页纸"。"萤火集"是我们为用户提供的一个公开展示自我、分享心声的公共空间。在这里，每一篇日记都如同一缕微小的萤火，汇聚起来便能照亮彼此的角落。为了维护这个空间的纯净、温暖与安全，保障每一位创作者的合法权益，我们特制定本公约。所有选择将日记公开发布至"萤火集"的用户，均应仔细阅读并共同遵守以下原则。</p>

          <h3 style="font-size: 1em; font-weight: bold; margin: 1.5em 0 0.5em 0;">一、核心理念：真诚、尊重与包容</h3>
          <ol style="margin: 0.5em 0 1em 1.5em; padding: 0;">
            <li><strong>倡导真诚表达：</strong>我们鼓励您记录真实的生活点滴与内心情感。这里是心灵的栖息地，请让您的文字源于真诚，传递温度。</li>
            <li><strong>秉持相互尊重：</strong>"萤火集"允许多元文化和思想的碰撞，但每一种合法的声音都建立在尊重的基础之上。请尊重他人的观点、信仰、性别及生活方式。</li>
            <li><strong>拒绝网络暴力：</strong>严禁任何形式的人身攻击、谩骂、恶意诋毁或歧视性言论。我们致力于打造一个没有戾气、安全友善的文字避风港。</li>
          </ol>

          <h3 style="font-size: 1em; font-weight: bold; margin: 1.5em 0 0.5em 0;">二、内容规范：合法与底线</h3>
          <ol style="margin: 0.5em 0 1em 1.5em; padding: 0;">
            <li><strong>遵守法律法规：</strong>严禁发布违反国家法律法规、危害国家安全、破坏社会公共利益的内容。</li>
            <li><strong>抵制不良信息：</strong>严禁发布含有色情、低俗、暴力、血腥、恐怖、迷信或教唆犯罪的文字及多媒体内容。</li>
            <li><strong>保护原创版权：</strong>尊重每一位创作者的劳动成果。请确保您发布在"萤火集"的日记为您本人原创或已获得合法授权。严禁抄袭、盗用或侵犯他人知识产权。如需引用，请明确注明出处。</li>
            <li><strong>杜绝垃圾广告：</strong>"萤火集"是纯粹的日记分享空间，严禁发布任何形式的商业营销、软文推广、恶意引流信息或欺诈内容。</li>
          </ol>

          <h3 style="font-size: 1em; font-weight: bold; margin: 1.5em 0 0.5em 0;">三、隐私与安全</h3>
          <ol style="margin: 0.5em 0 1em 1.5em; padding: 0;">
            <li><strong>尊重他人隐私：</strong>严禁未经授权公开他人的真实姓名、联系方式、家庭住址、照片等敏感个人信息。我们对任何形式的"人肉搜索"和隐私泄露行为零容忍。</li>
            <li><strong>审慎公开自我：</strong>您的日记一旦发布至"萤火集"，即意味着对公众可见。请您在操作前审慎评估内容，切勿过度暴露可能危及您人身、财产安全的私人信息。</li>
          </ol>

          <h3 style="font-size: 1em; font-weight: bold; margin: 1.5em 0 0.5em 0;">四、社区管理与违约处理</h3>
          <ol style="margin: 0.5em 0 1em 1.5em; padding: 0;">
            <li><strong>日常维护与监督：</strong>"半页纸"管理团队将对"萤火集"的公开内容进行日常维护，并开放用户举报机制。我们鼓励大家共同监督，维护社区环境。</li>
            <li><strong>违规处理措施：</strong>对于违反本公约的内容及账号，管理团队将视情节轻重，采取包括但不限于以下措施：
              <ul style="margin: 0.5em 0 0 1.5em;">
                <li>警告并要求整改；</li>
                <li>强制将违规日记转为私密或直接删除；</li>
                <li>暂停账号在"萤火集"的发布权限；</li>
                <li>永久封停账号。</li>
              </ul>
            </li>
            <li><strong>申诉机制：</strong>如您对管理团队的处理结果有异议，可通过官方客服渠道提出申诉，我们将秉公进行复核。</li>
          </ol>

          <h3 style="font-size: 1.1em; font-weight: bold; margin: 1.5em 0 0.5em 0;">结语</h3>
          <p>"半页纸"承载着您的私人记忆，而"萤火集"则是我们共同守护的星空。感谢您愿意将内心的微光在此点亮。让我们携手共建一个温暖、包容、纯粹的文字家园。</p>
          <p>本公约自公布之日起生效，"半页纸"运营团队保留对本公约的最终解释权及修订权。</p>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn variant="text" @click="closeCovenantDialog">关闭</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useDiaryEditorViewModel } from '@/composables/useDiaryEditorViewModel'

const fireflyCovenantDialog = ref(false)
const fireflyCovenantAgreed = ref(false)

const {
  loading,
  goBack,
  pageTitle,
  currentStatus,
  form,
  isFireflyMode,
  VISIBILITY_OPTIONS,
  WEATHER_OPTIONS,
  MOOD_OPTIONS,
  totalImageCount,
  photoInput,
  onPhotoChange,
  imagePreviewUrls,
  removeImage,
  openPhotoPicker,
  MAX_IMAGE_COUNT,
  uploadingPhotos,
  uploadCompletedCount,
  uploadTotalCount,
  uploadProgressValue,
  allowDraftAction,
  submitting,
  saveDraft,
  handlePrimaryAction: originalHandlePrimaryAction,
  primaryActionText,
  summarizeText,
  visibilityText,
  meta,
  formatDate
} = useDiaryEditorViewModel()

function closeCovenantDialog() {
  fireflyCovenantDialog.value = false
}

function openCovenantDialog() {
  fireflyCovenantDialog.value = true
}

function handlePrimaryAction() {
  // 直接调用原始函数
  originalHandlePrimaryAction()
}
</script>
